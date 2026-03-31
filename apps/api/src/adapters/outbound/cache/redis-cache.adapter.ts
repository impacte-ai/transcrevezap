import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../infrastructure/modules/redis.service';
import { CachePort } from '../../../domain/ports/outbound/cache.port';

@Injectable()
export class RedisCacheAdapter implements CachePort {
  constructor(private readonly redis: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.redis.getCache<T>(key);
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    return this.redis.setCache(key, value, ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    return this.redis.deleteCache(key);
  }

  async increment(key: string): Promise<number> {
    return this.redis.increment(key);
  }

  async publish(channel: string, message: unknown): Promise<void> {
    return this.redis.publish(channel, message);
  }
}
