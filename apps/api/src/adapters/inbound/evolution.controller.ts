import { Controller, Post, Param, Body, Logger, HttpCode } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { EvolutionMapper, EvolutionWebhookPayload } from '../mappers/evolution.mapper';
import { TRANSCRIPTION_USE_CASE, TranscriptionUseCase } from '../../domain/ports/inbound/transcription.use-case';
import { WEBHOOK_HUB_USE_CASE, WebhookHubUseCase } from '../../domain/ports/inbound/webhook-hub.use-case';
import { STORAGE_PORT, StoragePort } from '../../domain/ports/outbound/storage.port';

@Controller('webhook/evolution')
export class EvolutionController {
  private readonly logger = new Logger(EvolutionController.name);

  constructor(
    @Inject(TRANSCRIPTION_USE_CASE) private readonly transcription: TranscriptionUseCase,
    @Inject(WEBHOOK_HUB_USE_CASE) private readonly webhookHub: WebhookHubUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  @Post(':connectionId')
  @HttpCode(200)
  async handleWebhook(
    @Param('connectionId') connectionId: string,
    @Body() payload: EvolutionWebhookPayload,
  ) {
    this.logger.debug(`Webhook Evolution recebido para conexão ${connectionId}`);

    // Validate connection exists
    const connection = await this.storage.findConnectionById(connectionId);
    if (!connection || !connection.isActive) {
      this.logger.warn(`Conexão não encontrada ou inativa: ${connectionId}`);
      return { status: 'ignored', reason: 'connection_not_found' };
    }

    // Forward to webhook hub (fire-and-forget)
    this.webhookHub.forwardToAll(payload as Record<string, unknown>).catch((err) =>
      this.logger.error(`Erro ao encaminhar webhook: ${err.message}`),
    );

    // Map to AudioMessage
    const audioMessage = EvolutionMapper.toAudioMessage(payload, connectionId);
    if (!audioMessage) {
      return { status: 'ignored', reason: 'not_audio_message' };
    }

    // Inject connection credentials
    audioMessage.serverUrl = audioMessage.serverUrl || connection.apiUrl;
    audioMessage.apiKey = audioMessage.apiKey || connection.apiKey || undefined;
    audioMessage.instanceName = audioMessage.instanceName || connection.instanceName || undefined;

    // Process transcription
    try {
      const result = await this.transcription.process(audioMessage);
      return { status: 'processed', transcriptionId: result.id };
    } catch (error: any) {
      this.logger.warn(`Mensagem ignorada: ${error.message}`);
      return { status: 'ignored', reason: error.message };
    }
  }
}
