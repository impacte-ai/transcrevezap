import { WebhookRedirectEntity } from '../../entities/webhook-redirect.entity';

export interface WebhookHubUseCase {
  forwardToAll(payload: Record<string, unknown>, sourceHeaders?: Record<string, string>): Promise<void>;
  getRedirects(): Promise<WebhookRedirectEntity[]>;
  addRedirect(url: string, description?: string): Promise<WebhookRedirectEntity>;
  removeRedirect(id: string): Promise<void>;
  retryFailed(webhookId: string, failureId: string): Promise<void>;
}

export const WEBHOOK_HUB_USE_CASE = Symbol('WebhookHubUseCase');
