import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    // Get RBAC user by email
    const usersRes = await fetch(`${NESTJS_URL}/internal/users`, { cache: 'no-store' });
    const users = await usersRes.json();
    const rbacUser = users.find((u: { email: string }) => u.email === session.user.email);

    return NextResponse.json({
      id: rbacUser?.id || session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: rbacUser?.role || null,
      isActive: rbacUser?.isActive ?? true,
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao obter perfil' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
    }

    const body = await request.json();

    // Find RBAC user
    const usersRes = await fetch(`${NESTJS_URL}/internal/users`, { cache: 'no-store' });
    const users = await usersRes.json();
    const rbacUser = users.find((u: { email: string }) => u.email === session.user.email);

    if (!rbacUser) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // Update user via NestJS
    const updateBody: Record<string, string> = {};
    if (body.name) updateBody.name = body.name;
    if (body.email) updateBody.email = body.email;

    const response = await fetch(`${NESTJS_URL}/internal/users/${rbacUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateBody),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 });
  }
}
