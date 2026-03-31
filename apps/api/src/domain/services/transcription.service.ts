import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { AudioMessage } from '../entities/audio-message.entity';
import { TranscriptionEntity, OutputMode } from '../entities/transcription.entity';
import { TranscriptionUseCase } from '../ports/inbound/transcription.use-case';
import { STORAGE_PORT, StoragePort } from '../ports/outbound/storage.port';
import { CACHE_PORT, CachePort } from '../ports/outbound/cache.port';
import { TranscriptionFactory, STTProviderName } from '../../adapters/outbound/transcription/transcription.factory';
import { SummarizationFactory, LLMProviderName } from '../../adapters/outbound/summarization/summarization.factory';
import { MessagingFactory } from '../../adapters/outbound/messaging/messaging.factory';
import { ApiKeyRotationService } from './api-key-rotation.service';

@Injectable()
export class TranscriptionService implements TranscriptionUseCase {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    private readonly sttFactory: TranscriptionFactory,
    private readonly llmFactory: SummarizationFactory,
    private readonly messagingFactory: MessagingFactory,
    private readonly apiKeyRotation: ApiKeyRotationService,
  ) {}

  async process(message: AudioMessage): Promise<TranscriptionEntity> {
    const startTime = Date.now();
    this.logger.log(`Processando áudio de ${message.remoteJid} via ${message.provider}`);

    // 1. Filters
    await this.applyFilters(message);

    // 2. Load settings
    const settings = await this.loadSettings();

    // 3. Download audio
    const audioBuffer = await this.downloadAudio(message);

    // 4. Detect language
    const language = await this.resolveLanguage(message.remoteJid, settings.language);

    // 5. Transcribe (with key rotation)
    const sttAdapter = this.sttFactory.getAdapter(settings.sttProvider as STTProviderName);
    const sttApiKey = await this.apiKeyRotation.getWorkingKey(settings.sttProvider);
    let transcriptionResult;
    try {
      transcriptionResult = await sttAdapter.transcribe(
        audioBuffer,
        message.mimetype || 'audio/ogg',
        language || undefined,
        settings.useTimestamps,
        sttApiKey || undefined,
      );
    } catch (error: any) {
      if (sttApiKey && (error.message?.includes('401') || error.message?.includes('auth') || error.message?.includes('Unauthorized'))) {
        await this.apiKeyRotation.penalizeKey(settings.sttProvider, sttApiKey);
        const retrySttApiKey = await this.apiKeyRotation.getWorkingKey(settings.sttProvider);
        transcriptionResult = await sttAdapter.transcribe(
          audioBuffer,
          message.mimetype || 'audio/ogg',
          language || undefined,
          settings.useTimestamps,
          retrySttApiKey || undefined,
        );
      } else {
        throw error;
      }
    }

    // 5.1 Validate transcription content
    if (!transcriptionResult.text || transcriptionResult.text.trim().length < 10) {
      throw new Error('Transcrição vazia ou muito curta — áudio pode estar corrompido');
    }

    // 5.5 Translate if needed
    const autoTranslation = await this.storage.getSetting('language.autoTranslation');
    if (autoTranslation === 'true' && transcriptionResult.language && transcriptionResult.language !== settings.language) {
      try {
        const llmAdapter = this.llmFactory.getAdapter(settings.llmProvider as LLMProviderName);
        const llmApiKey = await this.apiKeyRotation.getWorkingKey(settings.llmProvider);
        const translationResult = await llmAdapter.summarize(
          `Traduza o seguinte texto de ${transcriptionResult.language} para ${settings.language}. Retorne APENAS o texto traduzido, sem explicações:\n\n${transcriptionResult.text}`,
          settings.language,
          llmApiKey || undefined,
        );
        if (translationResult.summary && translationResult.summary.length > 10) {
          transcriptionResult.text = translationResult.summary;
        }
      } catch (error: any) {
        this.logger.warn(`Falha na tradução automática: ${error.message}`);
      }
    }

    // 6. Summarize (if needed, with key rotation)
    let summary: string | undefined;
    if (this.shouldSummarize(settings.outputMode, transcriptionResult.text, settings.characterLimit)) {
      try {
        const llmAdapter = this.llmFactory.getAdapter(settings.llmProvider as LLMProviderName);
        const llmApiKey = await this.apiKeyRotation.getWorkingKey(settings.llmProvider);
        const sumResult = await llmAdapter.summarize(
          transcriptionResult.text,
          language || 'pt',
          llmApiKey || undefined,
        );
        summary = sumResult.summary;
      } catch (error: any) {
        if (error.message?.includes('401') || error.message?.includes('auth') || error.message?.includes('Unauthorized')) {
          const llmApiKey = await this.apiKeyRotation.getWorkingKey(settings.llmProvider);
          if (llmApiKey) {
            await this.apiKeyRotation.penalizeKey(settings.llmProvider, llmApiKey);
          }
        }
        this.logger.warn(`Falha na sumarização: ${error.message}`);
      }
    }

    // 6.1 Validate summary quality
    if (summary && summary.length >= transcriptionResult.text.length * 1.5) {
      this.logger.warn('Resumo maior que o texto original — possível erro do LLM');
    }
    if (!summary || summary.length < 10) {
      this.logger.warn('Resumo vazio, usando transcrição direta');
      summary = undefined;
    }

    // 7. Save transcription
    const transcription: TranscriptionEntity = {
      connectionId: message.connectionId,
      remoteJid: message.remoteJid,
      messageId: message.messageId,
      isGroup: message.isGroup,
      originalText: transcriptionResult.text,
      summary,
      language: transcriptionResult.language,
      duration: transcriptionResult.duration,
      provider: transcriptionResult.provider,
      model: transcriptionResult.model,
      processingMs: Date.now() - startTime,
      outputMode: settings.outputMode,
      status: 'completed',
    };

    const saved = await this.storage.createTranscription(transcription);

    // 8. Send response to WhatsApp
    try {
      await this.sendResponse(message, saved, settings);
    } catch (error: any) {
      this.logger.error(`Falha ao enviar resposta WhatsApp: ${error.message}`);
    }

    // 9. Update stats
    await this.cache.increment('stats:total');
    const todayKey = `stats:daily:${new Date().toISOString().split('T')[0]}`;
    await this.cache.increment(todayKey);

    // Update contact language if auto-detected
    if (transcriptionResult.language && language !== transcriptionResult.language) {
      await this.storage.setContactLanguage(
        message.remoteJid,
        transcriptionResult.language,
        true,
        0.9,
      );
    }

    this.logger.log(`Transcrição completa: ${saved.id} (${Date.now() - startTime}ms)`);
    return saved;
  }

  private async applyFilters(message: AudioMessage): Promise<void> {
    const blocked = await this.storage.isUserBlocked(message.remoteJid);
    if (blocked) throw new Error(`Usuário bloqueado: ${message.remoteJid}`);

    if (message.isGroup) {
      const allowed = await this.storage.isGroupAllowed(message.remoteJid);
      if (!allowed) throw new Error(`Grupo não permitido: ${message.remoteJid}`);
    }

    const processMode = await this.storage.getSetting('processing.mode') || 'all';
    if (processMode === 'groups_only' && !message.isGroup) {
      throw new Error('Modo somente grupos — mensagem privada ignorada');
    }

    const processSelf = await this.storage.getSetting('processing.selfMessages');
    if (message.fromMe && processSelf !== 'true') {
      throw new Error('Mensagens próprias desabilitadas');
    }
  }

  private async loadSettings() {
    return {
      sttProvider: await this.storage.getSetting('transcription.sttProvider') || 'groq',
      llmProvider: await this.storage.getSetting('transcription.llmProvider') || 'groq',
      language: await this.storage.getSetting('transcription.language') || 'pt',
      outputMode: (await this.storage.getSetting('transcription.outputMode') || 'both') as OutputMode,
      characterLimit: parseInt(await this.storage.getSetting('transcription.characterLimit') || '500', 10),
      useTimestamps: (await this.storage.getSetting('transcription.useTimestamps')) === 'true',
    };
  }

  private async downloadAudio(message: AudioMessage): Promise<Buffer> {
    // If mediaUrl is provided, download directly
    if (message.mediaUrl) {
      const response = await axios.get(message.mediaUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
      });
      return Buffer.from(response.data);
    }

    // If base64 data is provided
    if (message.base64Data) {
      return Buffer.from(message.base64Data, 'base64');
    }

    throw new Error('Nenhuma fonte de áudio disponível (mediaUrl ou base64)');
  }

  private async resolveLanguage(contactJid: string, defaultLanguage: string): Promise<string> {
    // Check contact-specific language
    const contactLang = await this.storage.getContactLanguage(contactJid);
    if (contactLang) return contactLang;

    // Check cache
    const cached = await this.cache.get<string>(`lang:${contactJid}`);
    if (cached) return cached;

    return defaultLanguage;
  }

  private shouldSummarize(outputMode: OutputMode, text: string, characterLimit: number): boolean {
    switch (outputMode) {
      case 'summary_only':
      case 'both':
        return true;
      case 'smart':
        return text.length > characterLimit;
      case 'transcription_only':
        return false;
      default:
        return false;
    }
  }

  private async sendResponse(
    message: AudioMessage,
    transcription: TranscriptionEntity,
    settings: Awaited<ReturnType<typeof this.loadSettings>>,
  ): Promise<void> {
    // Get connection details
    const connection = await this.storage.findConnectionById(message.connectionId);
    if (!connection) {
      this.logger.warn(`Conexão não encontrada: ${message.connectionId}`);
      return;
    }

    // Get messaging adapter
    const adapter = this.messagingFactory.getAdapter(connection.provider, {
      apiUrl: connection.apiUrl,
      apiKey: connection.apiKey || undefined,
      instanceName: connection.instanceName || undefined,
      providerToken: connection.providerToken || undefined,
    });

    // Load messaging settings
    const summaryHeader = await this.storage.getSetting('messaging.summaryHeader') || '📝 *Resumo do áudio:*';
    const transcriptionHeader = await this.storage.getSetting('messaging.transcriptionHeader') || '🎙️ *Transcrição do áudio:*';
    const businessMessage = await this.storage.getSetting('messaging.businessMessage') || '';

    let responseText = '';

    switch (settings.outputMode) {
      case 'summary_only':
        responseText = `${summaryHeader}\n\n${transcription.summary || transcription.originalText}`;
        break;
      case 'transcription_only':
        responseText = `${transcriptionHeader}\n\n${transcription.originalText}`;
        break;
      case 'both':
        if (transcription.summary) {
          responseText = `${summaryHeader}\n\n${transcription.summary}\n\n${transcriptionHeader}\n\n${transcription.originalText}`;
        } else {
          responseText = `${transcriptionHeader}\n\n${transcription.originalText}`;
        }
        break;
      case 'smart':
        if (transcription.summary) {
          responseText = `${summaryHeader}\n\n${transcription.summary}`;
        } else {
          responseText = `${transcriptionHeader}\n\n${transcription.originalText}`;
        }
        break;
    }

    if (businessMessage) {
      responseText += `\n\n${businessMessage}`;
    }

    // Send as reply to original audio message
    const result = await adapter.sendText({
      to: message.remoteJid,
      text: responseText,
      replyToMessageId: message.messageId,
    });

    this.logger.log(`Resposta enviada para ${message.remoteJid}: ${result.messageId}`);
  }
}
