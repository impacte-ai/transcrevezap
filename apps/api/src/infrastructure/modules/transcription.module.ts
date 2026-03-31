import { Module } from '@nestjs/common';
import { TranscriptionService } from '../../domain/services/transcription.service';
import { PrismaStorageAdapter } from '../../adapters/outbound/storage/prisma-storage.adapter';
import { RedisCacheAdapter } from '../../adapters/outbound/cache/redis-cache.adapter';
import { STORAGE_PORT } from '../../domain/ports/outbound/storage.port';
import { CACHE_PORT } from '../../domain/ports/outbound/cache.port';
import { TRANSCRIPTION_USE_CASE } from '../../domain/ports/inbound/transcription.use-case';

@Module({
  providers: [
    PrismaStorageAdapter,
    RedisCacheAdapter,
    { provide: STORAGE_PORT, useExisting: PrismaStorageAdapter },
    { provide: CACHE_PORT, useExisting: RedisCacheAdapter },
    { provide: TRANSCRIPTION_USE_CASE, useClass: TranscriptionService },
  ],
  exports: [TRANSCRIPTION_USE_CASE, STORAGE_PORT, CACHE_PORT],
})
export class TranscriptionModule {}
