import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { STORAGE_PORT, StoragePort } from '../ports/outbound/storage.port';

interface FetchedModel {
  modelId: string;
  name: string;
  type: 'stt' | 'llm';
  metadata?: string;
}

const PROVIDER_MODEL_ENDPOINTS: Record<string, { url: string; authHeader: string; authPrefix: string }> = {
  groq: { url: 'https://api.groq.com/openai/v1/models', authHeader: 'Authorization', authPrefix: 'Bearer ' },
  openai: { url: 'https://api.openai.com/v1/models', authHeader: 'Authorization', authPrefix: 'Bearer ' },
  openrouter: { url: 'https://openrouter.ai/api/v1/models', authHeader: 'Authorization', authPrefix: 'Bearer ' },
  deepgram: { url: 'https://api.deepgram.com/v1/models', authHeader: 'Authorization', authPrefix: 'Token ' },
  gemini: { url: 'https://generativelanguage.googleapis.com/v1beta/models', authHeader: '', authPrefix: '' },
};

const STT_KEYWORDS = ['whisper', 'transcri', 'audio', 'stt', 'nova', 'flux', 'speech-to-text'];
const EXCLUDED_MODELS = ['tts', 'dall-e', 'embedding', 'moderation'];

@Injectable()
export class ModelManagementService {
  private readonly logger = new Logger(ModelManagementService.name);

  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  async refreshModels(provider: string, apiKey: string): Promise<{ stt: number; llm: number }> {
    this.logger.log(`Atualizando modelos do provider: ${provider}`);

    let models: FetchedModel[];

    if (provider === 'gemini') {
      models = await this.fetchGeminiModels(apiKey);
    } else {
      models = await this.fetchOpenAICompatibleModels(provider, apiKey);
    }

    if (models.length === 0) {
      this.logger.warn(`Nenhum modelo encontrado para ${provider}`);
      return { stt: 0, llm: 0 };
    }

    await this.storage.upsertProviderModels(provider, models);

    const sttCount = models.filter((m) => m.type === 'stt').length;
    const llmCount = models.filter((m) => m.type === 'llm').length;

    this.logger.log(`${provider}: ${sttCount} modelos STT, ${llmCount} modelos LLM atualizados`);
    return { stt: sttCount, llm: llmCount };
  }

  private async fetchOpenAICompatibleModels(provider: string, apiKey: string): Promise<FetchedModel[]> {
    const config = PROVIDER_MODEL_ENDPOINTS[provider];
    if (!config) throw new Error(`Provider não suportado: ${provider}`);

    const headers: Record<string, string> = {};
    if (config.authHeader) {
      headers[config.authHeader] = `${config.authPrefix}${apiKey}`;
    }

    const response = await axios.get(config.url, { headers, timeout: 30000 });
    const rawModels = response.data?.data || response.data || [];

    return rawModels
      .filter((m: any) => {
        const id = (m.id || m.name || '').toLowerCase();
        return !EXCLUDED_MODELS.some((ex) => id.includes(ex));
      })
      .map((m: any) => {
        const id = (m.id || m.name || '').toLowerCase();
        const isSTT = STT_KEYWORDS.some((kw) => id.includes(kw));

        return {
          modelId: m.id || m.name,
          name: m.name || m.id,
          type: isSTT ? 'stt' : 'llm',
          metadata: JSON.stringify({
            owned_by: m.owned_by,
            context_length: m.context_length,
            pricing: m.pricing,
          }),
        } as FetchedModel;
      });
  }

  private async fetchGeminiModels(apiKey: string): Promise<FetchedModel[]> {
    const url = `${PROVIDER_MODEL_ENDPOINTS.gemini.url}?key=${apiKey}`;
    const response = await axios.get(url, { timeout: 30000 });
    const rawModels = response.data?.models || [];

    return rawModels
      .filter((m: any) => {
        const name = (m.name || '').toLowerCase();
        return name.includes('gemini') && !name.includes('embedding');
      })
      .map((m: any) => {
        const displayName = m.displayName || m.name;
        const methods = m.supportedGenerationMethods || [];
        const isSTT = methods.includes('generateContent') && displayName.toLowerCase().includes('audio');

        return {
          modelId: m.name?.replace('models/', '') || m.name,
          name: displayName,
          type: isSTT ? 'stt' : 'llm',
          metadata: JSON.stringify({
            description: m.description,
            inputTokenLimit: m.inputTokenLimit,
            outputTokenLimit: m.outputTokenLimit,
            methods,
          }),
        } as FetchedModel;
      });
  }

  async getModels(provider: string, type: 'stt' | 'llm'): Promise<Array<{ modelId: string; name: string; metadata?: string }>> {
    return this.storage.getProviderModels(provider, type);
  }
}
