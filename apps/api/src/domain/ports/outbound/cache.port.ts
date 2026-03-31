export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  increment(key: string): Promise<number>;
  publish(channel: string, message: unknown): Promise<void>;
}

export const CACHE_PORT = Symbol('CachePort');
