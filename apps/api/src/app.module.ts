import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { loadAppConfig } from './infrastructure/config/app.config';
import { PrismaModule } from './infrastructure/modules/prisma.module';
import { RedisModule } from './infrastructure/modules/redis.module';
import { TranscriptionModule } from './infrastructure/modules/transcription.module';
import { WebhookHubModule } from './infrastructure/modules/webhook-hub.module';
import { ConnectionModule } from './infrastructure/modules/connection.module';
import { MessagingModule } from './infrastructure/modules/messaging.module';
import { ModelManagementModule } from './infrastructure/modules/model-management.module';
import { HealthController } from './health.controller';
import { InternalController } from './adapters/inbound/internal.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadAppConfig],
    }),
    PrismaModule,
    RedisModule,
    TranscriptionModule,
    WebhookHubModule,
    ConnectionModule,
    MessagingModule,
    ModelManagementModule,
  ],
  controllers: [HealthController, InternalController],
})
export class AppModule {}
