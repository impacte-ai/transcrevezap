import Redis from 'ioredis';

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6380', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
    redis.on('error', () => {}); // Suppress connection errors in rate limiter
  }
  return redis;
}

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 900; // 15 minutes

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean; remainingAttempts: number; retryAfterMs?: number }> {
  try {
    const r = getRedis();
    const key = `ratelimit:login:${identifier}`;

    const current = await r.incr(key);
    if (current === 1) {
      await r.expire(key, WINDOW_SECONDS);
    }

    const ttl = await r.ttl(key);

    if (current > MAX_ATTEMPTS) {
      return { allowed: false, remainingAttempts: 0, retryAfterMs: ttl * 1000 };
    }

    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - current };
  } catch {
    // If Redis is down, allow the request (fail open for availability)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
}

export async function resetRateLimit(identifier: string): Promise<void> {
  try {
    const r = getRedis();
    await r.del(`ratelimit:login:${identifier}`);
  } catch {}
}
