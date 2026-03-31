import { Module } from '@nestjs/common';
import { WebhookHubService } from '../../domain/services/webhook-hub.service';
import { PrismaStorageAdapter } from '../../adapters/outbound/storage/prisma-storage.adapter';
import { RedisCacheAdapter } from '../../adapters/outbound/cache/redis-cache.adapter';
import { STORAGE_PORT } from '../../domain/ports/outbound/storage.port';
import { CACHE_PORT } from '../../domain/ports/outbound/cache.port';
import { WEBHOOK_HUB_USE_CASE } from '../../domain/ports/inbound/webhook-hub.use-case';

@Module({
  providers: [
    PrismaStorageAdapter,
    RedisCacheAdapter,
    { provide: STORAGE_PORT, useExisting: PrismaStorageAdapter },
    { provide: CACHE_PORT, useExisting: RedisCacheAdapter },
    { provide: WEBHOOK_HUB_USE_CASE, useClass: WebhookHubService },
  ],
  exports: [WEBHOOK_HUB_USE_CASE],
})
export class WebhookHubModule {}
