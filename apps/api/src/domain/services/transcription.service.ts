import { Inject, Injectable, Logger } from '@nestjs/common';
import { AudioMessage } from '../entities/audio-message.entity';
import { TranscriptionEntity, OutputMode } from '../entities/transcription.entity';
import { TranscriptionUseCase } from '../ports/inbound/transcription.use-case';
import { STORAGE_PORT, StoragePort } from '../ports/outbound/storage.port';
import { CACHE_PORT, CachePort } from '../ports/outbound/cache.port';

@Injectable()
export class TranscriptionService implements TranscriptionUseCase {
  private readonly logger = new Logger(TranscriptionService.name);

  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    // These will be injected when adapters are ready (Plans 3-4)
    // For now they're optional — the module won't wire them yet
  ) {}

  async process(message: AudioMessage): Promise<TranscriptionEntity> {
    const startTime = Date.now();
    this.logger.log(`Processando áudio de ${message.remoteJid} via ${message.provider}`);

    // 1. Filters
    const blocked = await this.storage.isUserBlocked(message.remoteJid);
    if (blocked) {
      throw new Error(`Usuário bloqueado: ${message.remoteJid}`);
    }

    if (message.isGroup) {
      const allowed = await this.storage.isGroupAllowed(message.remoteJid);
      if (!allowed) {
        throw new Error(`Grupo não permitido: ${message.remoteJid}`);
      }
    }

    const processMode = await this.storage.getSetting('processing.mode') || 'all';
    if (processMode === 'groups_only' && !message.isGroup) {
      throw new Error('Modo somente grupos — mensagem privada ignorada');
    }

    const processSelf = await this.storage.getSetting('processing.selfMessages');
    if (message.fromMe && processSelf !== 'true') {
      throw new Error('Mensagens próprias desabilitadas');
    }

    // Steps 2-8 (download, detect language, transcribe, summarize, reply, register, webhook hub)
    // will be implemented when AI and messaging adapters are available (Plans 3-4)

    const outputMode = (await this.storage.getSetting('transcription.outputMode') || 'both') as OutputMode;

    const transcription: TranscriptionEntity = {
      connectionId: message.connectionId,
      remoteJid: message.remoteJid,
      messageId: message.messageId,
      isGroup: message.isGroup,
      originalText: '[Aguardando implementação dos adapters de transcrição]',
      outputMode,
      provider: 'pending',
      model: 'pending',
      processingMs: Date.now() - startTime,
      status: 'processing',
    };

    const saved = await this.storage.createTranscription(transcription);
    await this.cache.increment('stats:total');

    this.logger.log(`Transcrição registrada: ${saved.id}`);
    return saved;
  }
}
