import { TranscriptionEntity } from '../../entities/transcription.entity';
import { ConnectionEntity, WhatsAppProvider } from '../../entities/connection.entity';
import { WebhookRedirectEntity, WebhookDeliveryFailureEntity } from '../../entities/webhook-redirect.entity';

export interface StoragePort {
  // Connections
  findConnectionById(id: string): Promise<ConnectionEntity | null>;
  findConnectionByWebhookPath(path: string): Promise<ConnectionEntity | null>;
  findAllConnections(): Promise<ConnectionEntity[]>;
  createConnection(data: Omit<ConnectionEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConnectionEntity>;
  updateConnection(id: string, data: Partial<ConnectionEntity>): Promise<ConnectionEntity>;
  deleteConnection(id: string): Promise<void>;

  // Transcriptions
  createTranscription(data: Omit<TranscriptionEntity, 'id' | 'createdAt'>): Promise<TranscriptionEntity>;
  findTranscriptions(filters: { connectionId?: string; limit?: number; offset?: number }): Promise<TranscriptionEntity[]>;
  countTranscriptions(filters?: { connectionId?: string; since?: Date }): Promise<number>;

  // Webhook Redirects
  findAllWebhookRedirects(): Promise<WebhookRedirectEntity[]>;
  findActiveWebhookRedirects(): Promise<WebhookRedirectEntity[]>;
  createWebhookRedirect(data: { url: string; description?: string }): Promise<WebhookRedirectEntity>;
  updateWebhookRedirect(id: string, data: Partial<WebhookRedirectEntity>): Promise<WebhookRedirectEntity>;
  deleteWebhookRedirect(id: string): Promise<void>;
  incrementWebhookSuccess(id: string): Promise<void>;
  incrementWebhookError(id: string, errorMsg: string): Promise<void>;

  // Webhook Failures
  createWebhookFailure(data: Omit<WebhookDeliveryFailureEntity, 'id' | 'createdAt'>): Promise<void>;
  findWebhookFailures(webhookId: string): Promise<WebhookDeliveryFailureEntity[]>;
  deleteWebhookFailure(id: string): Promise<void>;

  // Settings
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
  getAllSettings(): Promise<Record<string, string>>;

  // Access Control
  isUserBlocked(jid: string): Promise<boolean>;
  isGroupAllowed(jid: string): Promise<boolean>;
  getAllowedGroups(): Promise<Array<{ groupJid: string; name?: string }>>;
  getBlockedUsers(): Promise<Array<{ userJid: string; reason?: string }>>;
  addAllowedGroup(jid: string, name?: string): Promise<void>;
  removeAllowedGroup(jid: string): Promise<void>;
  addBlockedUser(jid: string, reason?: string): Promise<void>;
  removeBlockedUser(jid: string): Promise<void>;

  // Contact Language
  getContactLanguage(jid: string): Promise<string | null>;
  setContactLanguage(jid: string, language: string, autoDetected?: boolean, confidence?: number): Promise<void>;

  // Provider Models
  getProviderModels(provider: string, type: string): Promise<Array<{ modelId: string; name: string; metadata?: string }>>;
  upsertProviderModels(provider: string, models: Array<{ modelId: string; name: string; type: string; metadata?: string }>): Promise<void>;
}

export const STORAGE_PORT = Symbol('StoragePort');
