import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { MessagingPort, SendTextOptions } from '../../../domain/ports/outbound/messaging.port';
import { MediaPort, MediaDownloadResult } from '../../../domain/ports/outbound/media.port';

@Injectable()
export class ZproMessagingAdapter implements MessagingPort, MediaPort {
  private readonly logger = new Logger(ZproMessagingAdapter.name);

  private client: AxiosInstance = axios.create();
  private apiId: string = '';
  private secretKey: string = '';

  configure(apiUrl: string, apiId: string, bearerToken: string, secretKey: string) {
    this.apiId = apiId;
    this.secretKey = secretKey;
    this.client = axios.create({
      baseURL: apiUrl.replace(/\/$/, ''),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
      },
    });
  }

  async sendText(options: SendTextOptions): Promise<{ messageId: string }> {
    const body = {
      body: options.text,
      number: options.to.replace(/\D/g, '').replace(/@.*$/, ''),
      externalKey: this.secretKey,
      isClosed: false,
    };

    const response = await this.client.post(`/v2/api/external/${this.apiId}`, body);
    return { messageId: response.data?.messageId || response.data?.id || 'sent' };
  }

  async downloadAudio(messageId: string): Promise<MediaDownloadResult> {
    // ZPRO provides audio URL directly in webhook payload
    throw new Error('ZPRO: use mediaUrl do payload diretamente, não suporta download por ID');
  }

  async getBase64Audio(messageId: string): Promise<MediaDownloadResult> {
    return this.downloadAudio(messageId);
  }

  async fetchGroups(): Promise<Array<{ id: string; name: string }>> {
    // ZPRO doesn't have a standard group listing endpoint
    this.logger.warn('ZPRO: listagem de grupos não suportada via API');
    return [];
  }

  async getInstanceStatus(): Promise<{ connected: boolean; phoneNumber?: string }> {
    try {
      const response = await this.client.get(`/v2/api/external/${this.apiId}/status`);
      return { connected: response.data?.connected ?? false, phoneNumber: response.data?.phone };
    } catch {
      return { connected: false };
    }
  }

  async connectInstance(phoneNumber?: string): Promise<{ qrcode?: string; pairingCode?: string }> {
    const response = await this.client.get(`/v2/api/external/${this.apiId}/qrcode`);
    return { qrcode: response.data?.qrcode };
  }

  async disconnectInstance(): Promise<void> {
    await this.client.post(`/v2/api/external/${this.apiId}/disconnect`, {});
  }
}
