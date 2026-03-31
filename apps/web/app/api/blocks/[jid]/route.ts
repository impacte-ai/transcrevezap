import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ jid: string }> }) {
  try {
    const { jid } = await params;
    const response = await fetch(`${NESTJS_URL}/internal/users/blocked/${jid}`, { method: 'DELETE' });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
