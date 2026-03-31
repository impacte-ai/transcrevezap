import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ jid: string }> },
) {
  try {
    const { jid } = await params;
    const response = await fetch(`${NESTJS_URL}/internal/languages/contacts/${encodeURIComponent(jid)}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to delete contact language' }, { status: response.status });
    }
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
