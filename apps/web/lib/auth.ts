import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'sqlite' }),
  user: { modelName: 'authUser' },
  session: {
    modelName: 'authSession',
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  account: { modelName: 'authAccount' },
  verification: { modelName: 'authVerification' },
  emailAndPassword: { enabled: true },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
});
