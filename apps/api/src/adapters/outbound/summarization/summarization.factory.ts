import { Injectable, Logger } from '@nestjs/common';
import { SummarizationPort } from '../../../domain/ports/outbound/summarization.port';
import { OpenAICompatibleSummarizationAdapter } from './openai-compatible.adapter';
import { GeminiChatAdapter } from './gemini-chat.adapter';

export type LLMProviderName = 'groq' | 'openai' | 'gemini' | 'openrouter';

const PROVIDER_CONFIGS: Record<string, { baseUrl: string; defaultModel: string }> = {
  groq: { baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
  openai: { baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-5.4-nano' },
  openrouter: { baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o-mini' },
};

@Injectable()
export class SummarizationFactory {
  private readonly logger = new Logger(SummarizationFactory.name);

  constructor(
    private readonly openaiCompatible: OpenAICompatibleSummarizationAdapter,
    private readonly gemini: GeminiChatAdapter,
  ) {}

  getAdapter(provider: LLMProviderName): SummarizationPort {
    if (provider === 'gemini') {
      return this.gemini;
    }

    const config = PROVIDER_CONFIGS[provider];
    if (config) {
      this.openaiCompatible.configure({
        baseUrl: config.baseUrl,
        defaultModel: config.defaultModel,
        providerName: provider,
      });
      return this.openaiCompatible;
    }

    this.logger.warn(`Provider LLM desconhecido: ${provider}, usando groq como fallback`);
    this.openaiCompatible.configure({
      baseUrl: PROVIDER_CONFIGS.groq.baseUrl,
      defaultModel: PROVIDER_CONFIGS.groq.defaultModel,
      providerName: 'groq',
    });
    return this.openaiCompatible;
  }

  getAllProviderNames(): LLMProviderName[] {
    return ['groq', 'openai', 'gemini', 'openrouter'];
  }
}
