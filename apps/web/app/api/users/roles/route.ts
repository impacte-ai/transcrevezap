import { NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_INTERNAL_URL || 'http://localhost:8005';

export async function GET() {
  try {
    const response = await fetch(`${NESTJS_URL}/internal/users/roles`, { cache: 'no-store' });
    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
