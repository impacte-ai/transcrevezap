import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    const { provider } = await params;
    const body = await request.json();

    const response = await fetch(`${NESTJS_URL}/internal/models/${provider}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to refresh models' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
