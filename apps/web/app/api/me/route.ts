import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Find RBAC user with role and permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: {
          include: { permissions: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado no RBAC' }, { status: 404 });
    }

    // Parse permissions
    const permissions: Record<string, string[]> = {};
    for (const perm of user.role.permissions) {
      try {
        permissions[perm.entity] = JSON.parse(perm.actions);
      } catch {
        permissions[perm.entity] = [];
      }
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
      permissions,
      isActive: user.isActive,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar sessão' }, { status: 500 });
  }
}
