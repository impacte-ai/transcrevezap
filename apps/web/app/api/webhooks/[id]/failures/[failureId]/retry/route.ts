import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; failureId: string }> }
) {
  try {
    const { id, failureId } = await params;
    const response = await fetch(`${NESTJS_URL}/internal/webhooks/${id}/failures/${failureId}/retry`, {
      method: 'POST',
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
