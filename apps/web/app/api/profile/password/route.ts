import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const body = await request.json();

    if (!body.newPassword) {
      return NextResponse.json({ error: 'Nova senha obrigatoria' }, { status: 400 });
    }

    // Find RBAC user
    const usersRes = await fetch(`${NESTJS_URL}/internal/users`, { cache: 'no-store' });
    const users = await usersRes.json();
    const rbacUser = users.find((u: { email: string }) => u.email === session.user.email);

    if (!rbacUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Change password via NestJS
    const response = await fetch(`${NESTJS_URL}/internal/users/${rbacUser.id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: body.newPassword }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Erro ao alterar senha' }, { status: 500 });
  }
}
