import { Module } from '@nestjs/common';
import { ConnectionService } from '../../domain/services/connection.service';
import { PrismaStorageAdapter } from '../../adapters/outbound/storage/prisma-storage.adapter';
import { RedisCacheAdapter } from '../../adapters/outbound/cache/redis-cache.adapter';
import { STORAGE_PORT } from '../../domain/ports/outbound/storage.port';
import { CACHE_PORT } from '../../domain/ports/outbound/cache.port';
import { CONNECTION_USE_CASE } from '../../domain/ports/inbound/connection.use-case';

@Module({
  providers: [
    PrismaStorageAdapter,
    RedisCacheAdapter,
    { provide: STORAGE_PORT, useExisting: PrismaStorageAdapter },
    { provide: CACHE_PORT, useExisting: RedisCacheAdapter },
    { provide: CONNECTION_USE_CASE, useClass: ConnectionService },
  ],
  exports: [CONNECTION_USE_CASE],
})
export class ConnectionModule {}
