import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const response = await fetch(`${NESTJS_URL}/internal/webhooks/${id}/failures`, { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
