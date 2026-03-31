import { Injectable } from '@nestjs/common';
import { EvolutionMessagingAdapter } from './evolution.adapter';
import { UazapiMessagingAdapter } from './uazapi.adapter';
import { ZproMessagingAdapter } from './zpro.adapter';
import { MessagingPort } from '../../../domain/ports/outbound/messaging.port';

@Injectable()
export class MessagingFactory {
  constructor(
    private readonly evolution: EvolutionMessagingAdapter,
    private readonly uazapi: UazapiMessagingAdapter,
    private readonly zpro: ZproMessagingAdapter,
  ) {}

  getAdapter(
    provider: string,
    config: {
      apiUrl: string;
      apiKey?: string;
      instanceName?: string;
      providerToken?: string;
    },
  ): MessagingPort {
    switch (provider) {
      case 'evolution':
        this.evolution.configure(
          config.apiUrl,
          config.apiKey || '',
          config.instanceName || '',
        );
        return this.evolution;
      case 'uazapi':
        this.uazapi.configure(config.apiUrl, config.providerToken || '');
        return this.uazapi;
      case 'zpro':
        this.zpro.configure(
          config.apiUrl,
          '',
          config.providerToken || '',
          '',
        );
        return this.zpro;
      default:
        throw new Error(`Provider desconhecido: ${provider}`);
    }
  }
}
