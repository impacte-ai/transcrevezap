import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { WebhookHubService } from '../../domain/services/webhook-hub.service';
import { WebhookDeliveryProcessor } from '../../adapters/outbound/webhook/webhook-delivery.processor';
import { PrismaStorageAdapter } from '../../adapters/outbound/storage/prisma-storage.adapter';
import { STORAGE_PORT } from '../../domain/ports/outbound/storage.port';
import { WEBHOOK_HUB_USE_CASE } from '../../domain/ports/inbound/webhook-hub.use-case';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'webhook-deliveries' }),
  ],
  providers: [
    PrismaStorageAdapter,
    { provide: STORAGE_PORT, useExisting: PrismaStorageAdapter },
    { provide: WEBHOOK_HUB_USE_CASE, useClass: WebhookHubService },
    WebhookDeliveryProcessor,
  ],
  exports: [WEBHOOK_HUB_USE_CASE],
})
export class WebhookHubModule {}
