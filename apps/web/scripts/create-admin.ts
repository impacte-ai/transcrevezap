/**
 * Script to create a Better Auth user for login.
 *
 * Password hashing replicates better-auth's approach exactly:
 *   - Uses scrypt with N=16384, r=16, p=1, dkLen=64
 *   - Salt is 16 random bytes encoded as hex string (32 chars)
 *   - Stored as `${saltHex}:${keyHex}`
 *
 * Usage:
 *   DATABASE_URL="file:./packages/shared/prisma/dev.db" \
 *     pnpm --filter @transcrevezap/shared exec tsx ../../apps/web/scripts/create-admin.ts
 *
 * Or from project root:
 *   DATABASE_URL="file:$(pwd)/packages/shared/prisma/dev.db" \
 *     node_modules/.pnpm/tsx@4.21.0/node_modules/tsx/dist/cli.mjs apps/web/scripts/create-admin.ts
 */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const prisma = new PrismaClient();

const SCRYPT_PARAMS = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
};

/**
 * Hashes a password using the same algorithm as better-auth:
 * scrypt(password.normalize('NFKC'), saltHex, { N, r, p, dkLen })
 * stored as "saltHex:keyHex"
 */
async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.randomBytes(16);
  const salt = saltBytes.toString('hex'); // 32-char hex string
  const key = (await scrypt(password.normalize('NFKC'), salt, SCRYPT_PARAMS.dkLen, {
    N: SCRYPT_PARAMS.N,
    r: SCRYPT_PARAMS.r,
    p: SCRYPT_PARAMS.p,
    maxmem: 128 * SCRYPT_PARAMS.N * SCRYPT_PARAMS.r * 2,
  })) as Buffer;
  return `${salt}:${key.toString('hex')}`;
}

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@transcrevezap.local';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = 'Administrador';

  // Show existing Better Auth tables
  const tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'auth_%'"
  );
  console.log('Better Auth tables:', tables.map((t) => t.name));

  // Check if auth user already exists
  const existing = await prisma.$queryRawUnsafe<{ id: string; email: string }[]>(
    `SELECT id, email FROM auth_user WHERE email = ?`,
    email
  );

  if (existing.length > 0) {
    console.log(`Auth user already exists: ${email} (id: ${existing[0].id})`);
    console.log('No changes made. To recreate, delete the user from auth_user first.');
    return;
  }

  console.log(`Creating auth user: ${email} ...`);
  const hashedPassword = await hashPassword(password);
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();
  const now = new Date().toISOString();

  // Insert into auth_user
  await prisma.$executeRawUnsafe(
    `INSERT INTO auth_user (id, name, email, emailVerified, image, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    userId,
    name,
    email,
    1, // SQLite true
    null,
    now,
    now
  );

  // Insert into auth_account with email/password credential
  await prisma.$executeRawUnsafe(
    `INSERT INTO auth_account (id, accountId, providerId, userId, accessToken, refreshToken, idToken, accessTokenExpiresAt, refreshTokenExpiresAt, scope, password, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    accountId,
    userId,
    'credential',
    userId,
    null,
    null,
    null,
    null,
    null,
    null,
    hashedPassword,
    now,
    now
  );

  console.log('');
  console.log('Auth user created successfully:');
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log(`  id:       ${userId}`);
  console.log('');
  console.log('You can now login at http://localhost:3000/login');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
