import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
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
import { UsersController } from './adapters/inbound/users.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [loadAppConfig],
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0', 10),
        maxRetriesPerRequest: null,
      },
    }),
    PrismaModule,
    RedisModule,
    TranscriptionModule,
    WebhookHubModule,
    ConnectionModule,
    MessagingModule,
    ModelManagementModule,
    BullModule.registerQueue({ name: 'webhook-deliveries' }),
  ],
  controllers: [HealthController, InternalController, UsersController],
})
export class AppModule {}
