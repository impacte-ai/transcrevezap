import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WebhookRedirectEntity } from '../entities/webhook-redirect.entity';
import { WebhookHubUseCase } from '../ports/inbound/webhook-hub.use-case';
import { STORAGE_PORT, StoragePort } from '../ports/outbound/storage.port';

@Injectable()
export class WebhookHubService implements WebhookHubUseCase {
  private readonly logger = new Logger(WebhookHubService.name);

  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @InjectQueue('webhook-deliveries') private readonly webhookQueue: Queue,
  ) {}

  async forwardToAll(payload: Record<string, unknown>, sourceHeaders?: Record<string, string>): Promise<void> {
    const redirects = await this.storage.findActiveWebhookRedirects();
    if (redirects.length === 0) return;

    this.logger.log(`Enfileirando webhook para ${redirects.length} destinos`);

    const jobs = redirects.map((redirect) => ({
      name: `deliver-${redirect.id}`,
      data: {
        webhookId: redirect.id,
        url: redirect.url,
        payload,
      },
      opts: {
        attempts: 3,
        backoff: {
          type: 'exponential' as const,
          delay: 5000, // 5s → 25s → 125s
        },
        removeOnComplete: { age: 86400 }, // Keep completed jobs for 24h
        removeOnFail: { age: 604800 },    // Keep failed jobs for 7 days
      },
    }));

    await this.webhookQueue.addBulk(jobs);
    this.logger.debug(`${jobs.length} jobs enfileirados`);
  }

  async getRedirects(): Promise<WebhookRedirectEntity[]> {
    return this.storage.findAllWebhookRedirects();
  }

  async addRedirect(url: string, description?: string): Promise<WebhookRedirectEntity> {
    this.logger.log(`Adicionando webhook redirect: ${url}`);
    return this.storage.createWebhookRedirect({ url, description });
  }

  async removeRedirect(id: string): Promise<void> {
    this.logger.log(`Removendo webhook redirect: ${id}`);
    await this.storage.deleteWebhookRedirect(id);
  }

  async retryFailed(webhookId: string, failureId: string): Promise<void> {
    const failures = await this.storage.findWebhookFailures(webhookId);
    const failure = failures.find((f) => f.id === failureId);
    if (!failure) throw new Error(`Falha não encontrada: ${failureId}`);

    this.logger.log(`Retry manual: ${failureId} do webhook ${webhookId}`);

    // Re-enqueue the job
    await this.webhookQueue.add(`retry-${failureId}`, {
      webhookId,
      url: (await this.storage.findAllWebhookRedirects()).find((r) => r.id === webhookId)?.url || '',
      payload: JSON.parse(failure.payload),
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 86400 },
      removeOnFail: { age: 604800 },
    });

    // Remove from failures
    await this.storage.deleteWebhookFailure(failureId);
  }
}
