import { Inject, Injectable, Logger } from '@nestjs/common';
import { STORAGE_PORT, StoragePort } from '../ports/outbound/storage.port';
import { CACHE_PORT, CachePort } from '../ports/outbound/cache.port';

@Injectable()
export class ApiKeyRotationService {
  private readonly logger = new Logger(ApiKeyRotationService.name);
  private readonly PENALTY_TTL = 300; // 5 minutes

  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  async getWorkingKey(provider: string): Promise<string | null> {
    const keysJson = await this.storage.getSetting(`apikeys.${provider}`);
    if (!keysJson) return null;

    let keys: string[];
    try {
      keys = JSON.parse(keysJson);
    } catch {
      return keysJson; // Single key stored as plain string
    }

    if (!Array.isArray(keys) || keys.length === 0) return keysJson;
    if (keys.length === 1) return keys[0];

    // Round-robin with penalty check
    const counterKey = `keyrotation:${provider}:counter`;
    const counter = await this.cache.increment(counterKey);

    for (let i = 0; i < keys.length; i++) {
      const idx = (counter + i) % keys.length;
      const key = keys[idx];
      const penaltyKey = `keyrotation:${provider}:penalty:${this.hashKey(key)}`;
      const isPenalized = await this.cache.get<boolean>(penaltyKey);

      if (!isPenalized) {
        return key;
      }
    }

    // All keys penalized — return first one anyway (penalty may have expired)
    this.logger.warn(`Todas as chaves do provider ${provider} estão penalizadas, usando a primeira`);
    return keys[0];
  }

  async penalizeKey(provider: string, key: string): Promise<void> {
    const penaltyKey = `keyrotation:${provider}:penalty:${this.hashKey(key)}`;
    await this.cache.set(penaltyKey, true, this.PENALTY_TTL);
    this.logger.warn(`Chave ${provider} penalizada por ${this.PENALTY_TTL}s: ${key.substring(0, 8)}...`);
  }

  private hashKey(key: string): string {
    return Buffer.from(key).toString('base64').substring(0, 12);
  }
}
