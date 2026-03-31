export interface WebhookRedirectEntity {
  id: string;
  url: string;
  description?: string;
  isActive: boolean;
  successCount: number;
  errorCount: number;
  lastSuccess?: Date;
  lastError?: Date;
  lastErrorMsg?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WebhookDeliveryJob {
  webhookId: string;
  url: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  attempt: number;
}

export interface WebhookDeliveryFailureEntity {
  id?: string;
  webhookId: string;
  payload: string;
  statusCode?: number;
  error?: string;
  retryCount: number;
  createdAt?: Date;
}
