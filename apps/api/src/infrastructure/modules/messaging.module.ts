import { Module } from '@nestjs/common';
import { EvolutionMessagingAdapter } from '../../adapters/outbound/messaging/evolution.adapter';
import { UazapiMessagingAdapter } from '../../adapters/outbound/messaging/uazapi.adapter';
import { ZproMessagingAdapter } from '../../adapters/outbound/messaging/zpro.adapter';
import { EvolutionController } from '../../adapters/inbound/evolution.controller';
import { UazapiController } from '../../adapters/inbound/uazapi.controller';
import { ZproController } from '../../adapters/inbound/zpro.controller';
import { TranscriptionModule } from './transcription.module';
import { WebhookHubModule } from './webhook-hub.module';

@Module({
  imports: [TranscriptionModule, WebhookHubModule],
  controllers: [EvolutionController, UazapiController, ZproController],
  providers: [
    EvolutionMessagingAdapter,
    UazapiMessagingAdapter,
    ZproMessagingAdapter,
  ],
  exports: [
    EvolutionMessagingAdapter,
    UazapiMessagingAdapter,
    ZproMessagingAdapter,
  ],
})
export class MessagingModule {}
