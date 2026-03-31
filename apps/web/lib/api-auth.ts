import { auth } from './auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function requireAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Não autorizado' }, { status: 401 }) };
  }
  return { user: session.user };
}
