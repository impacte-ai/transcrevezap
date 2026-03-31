import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import axios from 'axios';
import { PrismaService } from '../../../infrastructure/modules/prisma.service';

export interface WebhookJobData {
  webhookId: string;
  url: string;
  payload: Record<string, unknown>;
}

@Processor('webhook-deliveries')
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<WebhookJobData>): Promise<void> {
    const { webhookId, url, payload } = job.data;
    const attempt = job.attemptsMade + 1;

    this.logger.debug(`Entregando webhook ${webhookId} → ${url} (tentativa ${attempt})`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-TranscreveZAP-Forward': 'true',
          'X-TranscreveZAP-Webhook-ID': webhookId,
          'User-Agent': 'TranscreveZAP/3.0',
        },
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Success — update stats
      await this.prisma.webhookRedirect.update({
        where: { id: webhookId },
        data: {
          successCount: { increment: 1 },
          lastSuccess: new Date(),
        },
      });

      this.logger.debug(`Webhook entregue: ${webhookId} → ${url} (${response.status})`);
    } catch (error: any) {
      const errorMsg = error.message || 'Erro desconhecido';

      // Update error stats
      await this.prisma.webhookRedirect.update({
        where: { id: webhookId },
        data: {
          errorCount: { increment: 1 },
          lastError: new Date(),
          lastErrorMsg: errorMsg,
        },
      }).catch(() => {}); // Don't fail the job on stats update error

      this.logger.warn(`Webhook falhou: ${webhookId} → ${url} (tentativa ${attempt}): ${errorMsg}`);

      // If this is the last attempt, save to failures table (DLQ)
      if (attempt >= 3) {
        await this.prisma.webhookDeliveryFailure.create({
          data: {
            webhookId,
            payload: JSON.stringify(payload),
            statusCode: error.response?.status,
            error: errorMsg,
            retryCount: attempt,
          },
        }).catch((e: any) => this.logger.error(`Erro ao salvar falha: ${e.message}`));

        this.logger.error(`Webhook movido para DLQ: ${webhookId} → ${url} após ${attempt} tentativas`);
      }

      // Re-throw to trigger BullMQ retry
      throw error;
    }
  }
}
