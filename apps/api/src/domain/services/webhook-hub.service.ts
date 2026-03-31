import { Inject, Injectable, Logger } from '@nestjs/common';
import { WebhookRedirectEntity } from '../entities/webhook-redirect.entity';
import { WebhookHubUseCase } from '../ports/inbound/webhook-hub.use-case';
import { STORAGE_PORT, StoragePort } from '../ports/outbound/storage.port';
import { CACHE_PORT, CachePort } from '../ports/outbound/cache.port';

@Injectable()
export class WebhookHubService implements WebhookHubUseCase {
  private readonly logger = new Logger(WebhookHubService.name);

  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  async forwardToAll(payload: Record<string, unknown>, sourceHeaders?: Record<string, string>): Promise<void> {
    const redirects = await this.storage.findActiveWebhookRedirects();
    if (redirects.length === 0) return;

    this.logger.log(`Encaminhando webhook para ${redirects.length} destinos`);

    // BullMQ integration will be added in Plan 5 (Webhook Hub)
    // For now, log the intent
    for (const redirect of redirects) {
      this.logger.debug(`Webhook enfileirado: ${redirect.url}`);
    }
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
    this.logger.log(`Retry de falha ${failureId} do webhook ${webhookId}`);
    // BullMQ retry will be added in Plan 5
    await this.storage.deleteWebhookFailure(failureId);
  }
}
