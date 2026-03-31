import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/modules/prisma.service';
import { createHash, randomBytes, randomUUID, scrypt } from 'crypto';

function hashScrypt(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 16384, r: 16, p: 1 }, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

@Controller('internal/users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getUsers() {
    return this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('roles')
  async getRoles() {
    return this.prisma.role.findMany({
      include: { permissions: true },
      orderBy: { name: 'asc' },
    });
  }

  @Post()
  async createUser(@Body() body: { name: string; email: string; password: string; roleId: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new HttpException('Email já cadastrado', HttpStatus.CONFLICT);

    // Create RBAC user
    const user = await this.prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash: createHash('sha256').update(body.password).digest('hex'),
        roleId: body.roleId,
        isActive: true,
      },
      include: { role: true },
    });

    // Create Better Auth user + account
    const now = new Date().toISOString();
    const authUserId = randomUUID();

    const salt = randomBytes(16).toString('hex');
    const key = await hashScrypt(body.password, salt);
    const hashedPassword = `${salt}:${key.toString('hex')}`;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO auth_user (id, name, email, "emailVerified", image, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?)`,
      authUserId, body.name, body.email, true, null, now, now,
    );

    const accountId = randomUUID();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO auth_account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt") VALUES (?, ?, ?, ?, ?, ?, ?)`,
      accountId, authUserId, 'credential', authUserId, hashedPassword, now, now,
    );

    return user;
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() body: { name?: string; email?: string; roleId?: string; isActive?: boolean }) {
    const currentUser = await this.prisma.user.findUnique({ where: { id } });
    if (!currentUser) throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);

    const user = await this.prisma.user.update({
      where: { id },
      data: body,
      include: { role: true },
    });

    // Update auth_user if name or email changed
    if (body.name || body.email) {
      const updates: string[] = [];
      const values: any[] = [];
      if (body.name) { updates.push('name = ?'); values.push(body.name); }
      if (body.email) { updates.push('email = ?'); values.push(body.email); }
      updates.push('"updatedAt" = ?');
      values.push(new Date().toISOString());
      values.push(currentUser.email);
      await this.prisma.$executeRawUnsafe(
        `UPDATE auth_user SET ${updates.join(', ')} WHERE email = ?`,
        ...values,
      ).catch(() => {});
    }

    return user;
  }

  @Put(':id/password')
  async changePassword(@Param('id') id: string, @Body() body: { password: string }) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);

    // Update RBAC password
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: createHash('sha256').update(body.password).digest('hex') },
    });

    // Update Better Auth password
    const salt = randomBytes(16).toString('hex');
    const key = await hashScrypt(body.password, salt);
    const hashedPassword = `${salt}:${key.toString('hex')}`;

    await this.prisma.$executeRawUnsafe(
      `UPDATE auth_account SET password = ?, "updatedAt" = ? WHERE "userId" IN (SELECT id FROM auth_user WHERE email = ?)`,
      hashedPassword, new Date().toISOString(), user.email,
    ).catch(() => {});

    return { success: true };
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);

    // Delete from auth system first
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM auth_account WHERE "userId" IN (SELECT id FROM auth_user WHERE email = ?)`, user.email,
    ).catch(() => {});
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM auth_session WHERE "userId" IN (SELECT id FROM auth_user WHERE email = ?)`, user.email,
    ).catch(() => {});
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM auth_user WHERE email = ?`, user.email,
    ).catch(() => {});

    // Delete RBAC user
    await this.prisma.user.delete({ where: { id } });

    return { success: true };
  }
}
