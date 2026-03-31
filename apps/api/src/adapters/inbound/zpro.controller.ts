import { Controller, Post, Param, Body, Logger, HttpCode } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ZproMapper, ZproWebhookPayload } from '../mappers/zpro.mapper';
import { TRANSCRIPTION_USE_CASE, TranscriptionUseCase } from '../../domain/ports/inbound/transcription.use-case';
import { WEBHOOK_HUB_USE_CASE, WebhookHubUseCase } from '../../domain/ports/inbound/webhook-hub.use-case';
import { STORAGE_PORT, StoragePort } from '../../domain/ports/outbound/storage.port';

@Controller('webhook/zpro')
export class ZproController {
  private readonly logger = new Logger(ZproController.name);

  constructor(
    @Inject(TRANSCRIPTION_USE_CASE) private readonly transcription: TranscriptionUseCase,
    @Inject(WEBHOOK_HUB_USE_CASE) private readonly webhookHub: WebhookHubUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
  ) {}

  @Post(':connectionId')
  @HttpCode(200)
  async handleWebhook(
    @Param('connectionId') connectionId: string,
    @Body() payload: ZproWebhookPayload,
  ) {
    this.logger.debug(`Webhook ZPRO recebido para conexão ${connectionId}`);

    const connection = await this.storage.findConnectionById(connectionId);
    if (!connection || !connection.isActive) {
      this.logger.warn(`Conexão não encontrada ou inativa: ${connectionId}`);
      return { status: 'ignored', reason: 'connection_not_found' };
    }

    this.webhookHub.forwardToAll(payload as Record<string, unknown>).catch((err) =>
      this.logger.error(`Erro ao encaminhar webhook: ${err.message}`),
    );

    const audioMessage = ZproMapper.toAudioMessage(payload, connectionId);
    if (!audioMessage) {
      return { status: 'ignored', reason: 'not_audio_message' };
    }

    try {
      const result = await this.transcription.process(audioMessage);
      return { status: 'processed', transcriptionId: result.id };
    } catch (error: any) {
      this.logger.warn(`Mensagem ignorada: ${error.message}`);
      return { status: 'ignored', reason: error.message };
    }
  }
}
