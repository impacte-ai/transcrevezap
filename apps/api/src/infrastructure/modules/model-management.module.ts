import { Module } from '@nestjs/common';
import { ModelManagementService } from '../../domain/services/model-management.service';
import { PrismaStorageAdapter } from '../../adapters/outbound/storage/prisma-storage.adapter';
import { STORAGE_PORT } from '../../domain/ports/outbound/storage.port';

@Module({
  providers: [
    ModelManagementService,
    PrismaStorageAdapter,
    { provide: STORAGE_PORT, useExisting: PrismaStorageAdapter },
  ],
  exports: [ModelManagementService],
})
export class ModelManagementModule {}
