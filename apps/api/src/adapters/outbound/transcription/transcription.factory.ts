import { Injectable, Logger } from '@nestjs/common';
import { TranscriptionPort } from '../../../domain/ports/outbound/transcription.port';
import { GroqTranscriptionAdapter } from './groq.adapter';
import { OpenAITranscriptionAdapter } from './openai.adapter';
import { DeepgramTranscriptionAdapter } from './deepgram.adapter';
import { GeminiTranscriptionAdapter } from './gemini.adapter';
import { OpenRouterTranscriptionAdapter } from './openrouter.adapter';

export type STTProviderName = 'groq' | 'openai' | 'deepgram' | 'gemini' | 'openrouter';

@Injectable()
export class TranscriptionFactory {
  private readonly logger = new Logger(TranscriptionFactory.name);

  constructor(
    private readonly groq: GroqTranscriptionAdapter,
    private readonly openai: OpenAITranscriptionAdapter,
    private readonly deepgram: DeepgramTranscriptionAdapter,
    private readonly gemini: GeminiTranscriptionAdapter,
    private readonly openrouter: OpenRouterTranscriptionAdapter,
  ) {}

  getAdapter(provider: STTProviderName): TranscriptionPort {
    switch (provider) {
      case 'groq': return this.groq;
      case 'openai': return this.openai;
      case 'deepgram': return this.deepgram;
      case 'gemini': return this.gemini;
      case 'openrouter': return this.openrouter;
      default:
        this.logger.warn(`Provider STT desconhecido: ${provider}, usando groq como fallback`);
        return this.groq;
    }
  }

  getAllProviderNames(): STTProviderName[] {
    return ['groq', 'openai', 'deepgram', 'gemini', 'openrouter'];
  }
}
