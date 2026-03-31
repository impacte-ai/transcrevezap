import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/modules/prisma.service';
import { StoragePort } from '../../../domain/ports/outbound/storage.port';
import { ConnectionEntity } from '../../../domain/entities/connection.entity';
import { TranscriptionEntity } from '../../../domain/entities/transcription.entity';
import { WebhookRedirectEntity, WebhookDeliveryFailureEntity } from '../../../domain/entities/webhook-redirect.entity';

@Injectable()
export class PrismaStorageAdapter implements StoragePort {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Connections ----

  async findConnectionById(id: string): Promise<ConnectionEntity | null> {
    const conn = await this.prisma.connection.findUnique({ where: { id } });
    return conn as ConnectionEntity | null;
  }

  async findConnectionByWebhookPath(path: string): Promise<ConnectionEntity | null> {
    const conn = await this.prisma.connection.findUnique({ where: { webhookPath: path } });
    return conn as ConnectionEntity | null;
  }

  async findAllConnections(): Promise<ConnectionEntity[]> {
    const conns = await this.prisma.connection.findMany({ orderBy: { createdAt: 'desc' } });
    return conns as ConnectionEntity[];
  }

  async createConnection(data: Omit<ConnectionEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ConnectionEntity> {
    const conn = await this.prisma.connection.create({ data: data as any });
    return conn as ConnectionEntity;
  }

  async updateConnection(id: string, data: Partial<ConnectionEntity>): Promise<ConnectionEntity> {
    const { id: _, createdAt, ...updateData } = data as any;
    const conn = await this.prisma.connection.update({ where: { id }, data: updateData });
    return conn as ConnectionEntity;
  }

  async deleteConnection(id: string): Promise<void> {
    await this.prisma.connection.delete({ where: { id } });
  }

  // ---- Transcriptions ----

  async createTranscription(data: Omit<TranscriptionEntity, 'id' | 'createdAt'>): Promise<TranscriptionEntity> {
    const t = await this.prisma.transcription.create({ data: data as any });
    return t as unknown as TranscriptionEntity;
  }

  async findTranscriptions(filters: { connectionId?: string; limit?: number; offset?: number }): Promise<TranscriptionEntity[]> {
    const results = await this.prisma.transcription.findMany({
      where: filters.connectionId ? { connectionId: filters.connectionId } : undefined,
      take: filters.limit || 50,
      skip: filters.offset || 0,
      orderBy: { createdAt: 'desc' },
    });
    return results as unknown as TranscriptionEntity[];
  }

  async countTranscriptions(filters?: { connectionId?: string; since?: Date }): Promise<number> {
    return this.prisma.transcription.count({
      where: {
        ...(filters?.connectionId ? { connectionId: filters.connectionId } : {}),
        ...(filters?.since ? { createdAt: { gte: filters.since } } : {}),
      },
    });
  }

  // ---- Webhook Redirects ----

  async findAllWebhookRedirects(): Promise<WebhookRedirectEntity[]> {
    const redirects = await this.prisma.webhookRedirect.findMany({ orderBy: { createdAt: 'desc' } });
    return redirects as WebhookRedirectEntity[];
  }

  async findActiveWebhookRedirects(): Promise<WebhookRedirectEntity[]> {
    const redirects = await this.prisma.webhookRedirect.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return redirects as WebhookRedirectEntity[];
  }

  async createWebhookRedirect(data: { url: string; description?: string }): Promise<WebhookRedirectEntity> {
    const redirect = await this.prisma.webhookRedirect.create({ data });
    return redirect as WebhookRedirectEntity;
  }

  async updateWebhookRedirect(id: string, data: Partial<WebhookRedirectEntity>): Promise<WebhookRedirectEntity> {
    const { id: _, createdAt, failedDeliveries, ...updateData } = data as any;
    const redirect = await this.prisma.webhookRedirect.update({ where: { id }, data: updateData });
    return redirect as WebhookRedirectEntity;
  }

  async deleteWebhookRedirect(id: string): Promise<void> {
    await this.prisma.webhookRedirect.delete({ where: { id } });
  }

  async incrementWebhookSuccess(id: string): Promise<void> {
    await this.prisma.webhookRedirect.update({
      where: { id },
      data: { successCount: { increment: 1 }, lastSuccess: new Date() },
    });
  }

  async incrementWebhookError(id: string, errorMsg: string): Promise<void> {
    await this.prisma.webhookRedirect.update({
      where: { id },
      data: { errorCount: { increment: 1 }, lastError: new Date(), lastErrorMsg: errorMsg },
    });
  }

  // ---- Webhook Failures ----

  async createWebhookFailure(data: Omit<WebhookDeliveryFailureEntity, 'id' | 'createdAt'>): Promise<void> {
    await this.prisma.webhookDeliveryFailure.create({ data: data as any });
  }

  async findWebhookFailures(webhookId: string): Promise<WebhookDeliveryFailureEntity[]> {
    const failures = await this.prisma.webhookDeliveryFailure.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return failures as WebhookDeliveryFailureEntity[];
  }

  async deleteWebhookFailure(id: string): Promise<void> {
    await this.prisma.webhookDeliveryFailure.delete({ where: { id } });
  }

  // ---- Settings ----

  async getSetting(key: string): Promise<string | null> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting?.value ?? null;
  }

  async setSetting(key: string, value: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const settings = await this.prisma.setting.findMany();
    return Object.fromEntries(settings.map((s) => [s.key, s.value]));
  }

  // ---- Access Control ----

  async isUserBlocked(jid: string): Promise<boolean> {
    const user = await this.prisma.blockedUser.findUnique({ where: { userJid: jid } });
    return user !== null;
  }

  async isGroupAllowed(jid: string): Promise<boolean> {
    const group = await this.prisma.allowedGroup.findUnique({ where: { groupJid: jid } });
    return group !== null;
  }

  async getAllowedGroups(): Promise<Array<{ groupJid: string; name?: string }>> {
    const rows = await this.prisma.allowedGroup.findMany({ select: { groupJid: true, name: true } });
    return rows.map((r) => ({ groupJid: r.groupJid, name: r.name ?? undefined }));
  }

  async getBlockedUsers(): Promise<Array<{ userJid: string; reason?: string }>> {
    const rows = await this.prisma.blockedUser.findMany({ select: { userJid: true, reason: true } });
    return rows.map((r) => ({ userJid: r.userJid, reason: r.reason ?? undefined }));
  }

  async addAllowedGroup(jid: string, name?: string): Promise<void> {
    await this.prisma.allowedGroup.upsert({
      where: { groupJid: jid },
      update: { name },
      create: { groupJid: jid, name },
    });
  }

  async removeAllowedGroup(jid: string): Promise<void> {
    await this.prisma.allowedGroup.deleteMany({ where: { groupJid: jid } });
  }

  async addBlockedUser(jid: string, reason?: string): Promise<void> {
    await this.prisma.blockedUser.upsert({
      where: { userJid: jid },
      update: { reason },
      create: { userJid: jid, reason },
    });
  }

  async removeBlockedUser(jid: string): Promise<void> {
    await this.prisma.blockedUser.deleteMany({ where: { userJid: jid } });
  }

  // ---- Contact Language ----

  async getContactLanguage(jid: string): Promise<string | null> {
    const contact = await this.prisma.contactLanguage.findUnique({ where: { contactJid: jid } });
    return contact?.language ?? null;
  }

  async setContactLanguage(jid: string, language: string, autoDetected = false, confidence?: number): Promise<void> {
    await this.prisma.contactLanguage.upsert({
      where: { contactJid: jid },
      update: { language, autoDetected, confidence },
      create: { contactJid: jid, language, autoDetected, confidence },
    });
  }

  async getAllContactLanguages(): Promise<Array<{ contactJid: string; language: string; autoDetected: boolean; confidence?: number | null; updatedAt: Date }>> {
    return this.prisma.contactLanguage.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  async deleteContactLanguage(jid: string): Promise<void> {
    await this.prisma.contactLanguage.deleteMany({ where: { contactJid: jid } });
  }

  // ---- Provider Models ----

  async getProviderModels(provider: string, type: string): Promise<Array<{ modelId: string; name: string; metadata?: string }>> {
    const rows = await this.prisma.providerModel.findMany({
      where: { provider, type },
      select: { modelId: true, name: true, metadata: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((r) => ({ modelId: r.modelId, name: r.name, metadata: r.metadata ?? undefined }));
  }

  async upsertProviderModels(provider: string, models: Array<{ modelId: string; name: string; type: string; metadata?: string }>): Promise<void> {
    // Delete existing models for this provider+type, then insert new ones
    const types = [...new Set(models.map((m) => m.type))];
    for (const type of types) {
      await this.prisma.providerModel.deleteMany({ where: { provider, type } });
    }
    await this.prisma.providerModel.createMany({
      data: models.map((m) => ({ provider, ...m })),
    });
  }
}
