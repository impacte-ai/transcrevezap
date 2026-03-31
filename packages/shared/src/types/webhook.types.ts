export interface WebhookRedirectInfo {
  id: string;
  url: string;
  description?: string;
  isActive: boolean;
  successCount: number;
  errorCount: number;
  lastSuccess?: Date;
  lastError?: Date;
  lastErrorMsg?: string;
}

export interface WebhookDeliveryJob {
  webhookId: string;
  url: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  attempt: number;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
}
