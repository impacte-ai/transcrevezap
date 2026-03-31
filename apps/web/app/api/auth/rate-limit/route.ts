import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const result = await checkRateLimit(ip);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.', retryAfterMs: result.retryAfterMs },
      { status: 429 }
    );
  }

  return NextResponse.json({ allowed: true, remainingAttempts: result.remainingAttempts });
}
