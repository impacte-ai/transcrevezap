import { Module } from '@nestjs/common';
import { TranscriptionService } from '../../domain/services/transcription.service';
import { PrismaStorageAdapter } from '../../adapters/outbound/storage/prisma-storage.adapter';
import { RedisCacheAdapter } from '../../adapters/outbound/cache/redis-cache.adapter';
import { GroqTranscriptionAdapter } from '../../adapters/outbound/transcription/groq.adapter';
import { OpenAITranscriptionAdapter } from '../../adapters/outbound/transcription/openai.adapter';
import { DeepgramTranscriptionAdapter } from '../../adapters/outbound/transcription/deepgram.adapter';
import { GeminiTranscriptionAdapter } from '../../adapters/outbound/transcription/gemini.adapter';
import { OpenRouterTranscriptionAdapter } from '../../adapters/outbound/transcription/openrouter.adapter';
import { TranscriptionFactory } from '../../adapters/outbound/transcription/transcription.factory';
import { OpenAICompatibleSummarizationAdapter } from '../../adapters/outbound/summarization/openai-compatible.adapter';
import { GeminiChatAdapter } from '../../adapters/outbound/summarization/gemini-chat.adapter';
import { SummarizationFactory } from '../../adapters/outbound/summarization/summarization.factory';
import { STORAGE_PORT } from '../../domain/ports/outbound/storage.port';
import { CACHE_PORT } from '../../domain/ports/outbound/cache.port';
import { TRANSCRIPTION_USE_CASE } from '../../domain/ports/inbound/transcription.use-case';

@Module({
  providers: [
    PrismaStorageAdapter,
    RedisCacheAdapter,
    { provide: STORAGE_PORT, useExisting: PrismaStorageAdapter },
    { provide: CACHE_PORT, useExisting: RedisCacheAdapter },
    // STT Adapters
    GroqTranscriptionAdapter,
    OpenAITranscriptionAdapter,
    DeepgramTranscriptionAdapter,
    GeminiTranscriptionAdapter,
    OpenRouterTranscriptionAdapter,
    TranscriptionFactory,
    // LLM Adapters
    OpenAICompatibleSummarizationAdapter,
    GeminiChatAdapter,
    SummarizationFactory,
    // Use Case
    { provide: TRANSCRIPTION_USE_CASE, useClass: TranscriptionService },
  ],
  exports: [TRANSCRIPTION_USE_CASE, STORAGE_PORT, CACHE_PORT, TranscriptionFactory, SummarizationFactory],
})
export class TranscriptionModule {}
