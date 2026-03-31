import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ provider: string; type: string }> },
) {
  try {
    const { provider, type } = await params;
    const response = await fetch(`${NESTJS_URL}/internal/models/${provider}/${type}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
