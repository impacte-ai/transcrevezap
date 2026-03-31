import { Controller, Get, Post, Delete, Body, Param, Query, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { CONNECTION_USE_CASE, ConnectionUseCase, CreateConnectionData } from '../../domain/ports/inbound/connection.use-case';
import { WEBHOOK_HUB_USE_CASE, WebhookHubUseCase } from '../../domain/ports/inbound/webhook-hub.use-case';
import { STORAGE_PORT, StoragePort } from '../../domain/ports/outbound/storage.port';
import { CACHE_PORT, CachePort } from '../../domain/ports/outbound/cache.port';
import { ModelManagementService } from '../../domain/services/model-management.service';

@Controller('internal')
export class InternalController {
  constructor(
    @Inject(CONNECTION_USE_CASE) private readonly connections: ConnectionUseCase,
    @Inject(WEBHOOK_HUB_USE_CASE) private readonly webhookHub: WebhookHubUseCase,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    private readonly modelManagement: ModelManagementService,
  ) {}

  // ---- Connections ----

  @Get('connections')
  async getConnections() {
    return this.connections.getAll();
  }

  @Get('connections/:id')
  async getConnection(@Param('id') id: string) {
    const conn = await this.connections.getById(id);
    if (!conn) throw new HttpException('Conexão não encontrada', HttpStatus.NOT_FOUND);
    return conn;
  }

  @Post('connections')
  async createConnection(@Body() data: CreateConnectionData) {
    return this.connections.create(data);
  }

  @Delete('connections/:id')
  async deleteConnection(@Param('id') id: string) {
    await this.connections.delete(id);
    return { success: true };
  }

  @Post('connections/:id/connect')
  async connectInstance(@Param('id') id: string, @Body() body: { phoneNumber?: string }) {
    return this.connections.connect(id, body?.phoneNumber);
  }

  @Post('connections/:id/disconnect')
  async disconnectInstance(@Param('id') id: string) {
    await this.connections.disconnect(id);
    return { success: true };
  }

  @Get('connections/:id/status')
  async getConnectionStatus(@Param('id') id: string) {
    return this.connections.getStatus(id);
  }

  // ---- Webhooks ----

  @Get('webhooks')
  async getWebhooks() {
    return this.webhookHub.getRedirects();
  }

  @Post('webhooks')
  async addWebhook(@Body() body: { url: string; description?: string }) {
    return this.webhookHub.addRedirect(body.url, body.description);
  }

  @Delete('webhooks/:id')
  async removeWebhook(@Param('id') id: string) {
    await this.webhookHub.removeRedirect(id);
    return { success: true };
  }

  // ---- Settings ----

  @Get('settings')
  async getSettings() {
    return this.storage.getAllSettings();
  }

  @Post('settings')
  async updateSetting(@Body() body: { key: string; value: string }) {
    await this.storage.setSetting(body.key, body.value);
    return { success: true };
  }

  // ---- Stats ----

  @Get('stats')
  async getStats() {
    const total = await this.cache.get<number>('stats:total') || 0;
    const todayKey = `stats:daily:${new Date().toISOString().split('T')[0]}`;
    const today = await this.cache.get<number>(todayKey) || 0;
    const totalDb = await this.storage.countTranscriptions();
    const connections = await this.storage.findAllConnections();
    const activeConnections = connections.filter((c) => c.status === 'connected').length;

    return {
      total: totalDb,
      today,
      activeConnections,
      totalConnections: connections.length,
    };
  }

  // ---- Access Control ----

  @Get('groups/allowed')
  async getAllowedGroups() {
    return this.storage.getAllowedGroups();
  }

  @Post('groups/allowed')
  async addAllowedGroup(@Body() body: { jid: string; name?: string }) {
    await this.storage.addAllowedGroup(body.jid, body.name);
    return { success: true };
  }

  @Delete('groups/allowed/:jid')
  async removeAllowedGroup(@Param('jid') jid: string) {
    await this.storage.removeAllowedGroup(jid);
    return { success: true };
  }

  @Get('users/blocked')
  async getBlockedUsers() {
    return this.storage.getBlockedUsers();
  }

  @Post('users/blocked')
  async addBlockedUser(@Body() body: { jid: string; reason?: string }) {
    await this.storage.addBlockedUser(body.jid, body.reason);
    return { success: true };
  }

  @Delete('users/blocked/:jid')
  async removeBlockedUser(@Param('jid') jid: string) {
    await this.storage.removeBlockedUser(jid);
    return { success: true };
  }

  // ---- Languages ----

  @Get('languages')
  async getContactLanguages() {
    // Returns all configured contact languages from settings
    const autoDetection = await this.storage.getSetting('language.autoDetection');
    const autoTranslation = await this.storage.getSetting('language.autoTranslation');
    const defaultLanguage = await this.storage.getSetting('transcription.language');
    return { autoDetection, autoTranslation, defaultLanguage };
  }

  // ---- Provider Models ----

  @Get('models/:provider/:type')
  async getModels(@Param('provider') provider: string, @Param('type') type: string) {
    return this.storage.getProviderModels(provider, type);
  }

  @Post('models/:provider/refresh')
  async refreshModels(@Param('provider') provider: string, @Body() body: { apiKey: string }) {
    return this.modelManagement.refreshModels(provider, body.apiKey);
  }
}
