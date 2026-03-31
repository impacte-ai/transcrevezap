import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { MessagingPort, SendTextOptions } from '../../../domain/ports/outbound/messaging.port';
import { MediaPort, MediaDownloadResult } from '../../../domain/ports/outbound/media.port';

@Injectable()
export class UazapiMessagingAdapter implements MessagingPort, MediaPort {
  private readonly logger = new Logger(UazapiMessagingAdapter.name);

  private client: AxiosInstance = axios.create();
  private token: string = '';

  configure(apiUrl: string, token: string) {
    this.token = token;
    this.client = axios.create({
      baseURL: apiUrl.replace(/\/$/, ''),
      timeout: 30000,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    });
  }

  private get headers() {
    return { token: this.token };
  }

  private formatPhone(number: string): string {
    const digits = number.replace(/\D/g, '').replace(/@.*$/, '');
    if (!digits) return '';
    return digits.length <= 11 ? `55${digits}` : digits;
  }

  async sendText(options: SendTextOptions): Promise<{ messageId: string }> {
    const body: Record<string, any> = {
      number: this.formatPhone(options.to),
      text: options.text,
    };
    if (options.replyToMessageId) {
      // Strip owner: prefix if present (UAZAPI expects just the hash)
      const colonIdx = options.replyToMessageId.lastIndexOf(':');
      body.replyid = colonIdx >= 0
        ? options.replyToMessageId.substring(colonIdx + 1)
        : options.replyToMessageId;
    }

    const response = await this.client.post('/send/text', body, { headers: this.headers });
    return { messageId: response.data?.messageId || response.data?.id || 'sent' };
  }

  async downloadAudio(messageId: string): Promise<MediaDownloadResult> {
    const response = await this.client.post(
      '/message/download',
      {
        id: messageId,
        return_base64: true,
        return_link: false,
        generate_mp3: true,
      },
      { headers: this.headers, timeout: 60000 },
    );

    const data = response.data;
    if (data.error) throw new Error(`UAZAPI download error: ${data.error}`);

    if (data.base64Data) {
      return {
        buffer: Buffer.from(data.base64Data, 'base64'),
        mimetype: data.mimetype || 'audio/mp3',
      };
    }

    throw new Error('UAZAPI: nenhum dado de áudio retornado');
  }

  async getBase64Audio(messageId: string): Promise<MediaDownloadResult> {
    return this.downloadAudio(messageId);
  }

  async fetchGroups(): Promise<Array<{ id: string; name: string }>> {
    const response = await this.client.get('/group/list', { headers: this.headers });
    return (response.data || []).map((g: any) => ({
      id: g.id || g.jid,
      name: g.subject || g.name || g.id,
    }));
  }

  async getInstanceStatus(): Promise<{ connected: boolean; phoneNumber?: string }> {
    try {
      const response = await this.client.get('/instance/status', { headers: this.headers });
      const status = response.data?.status || {};
      let phoneNumber = '';
      if (status.jid && typeof status.jid === 'string') {
        phoneNumber = status.jid.split(':')[0].split('@')[0];
      }
      return {
        connected: status.connected || false,
        phoneNumber: phoneNumber || undefined,
      };
    } catch {
      return { connected: false };
    }
  }

  async connectInstance(phoneNumber?: string): Promise<{ qrcode?: string; pairingCode?: string }> {
    const body: Record<string, string> = {};
    if (phoneNumber) body.phone = phoneNumber;

    const response = await this.client.post('/instance/connect', body, { headers: this.headers });
    const instance = response.data?.instance || response.data;
    return {
      qrcode: instance?.qrcode || instance?.qrcode_url,
      pairingCode: instance?.paircode,
    };
  }

  async disconnectInstance(): Promise<void> {
    await this.client.post('/instance/disconnect', {}, { headers: this.headers });
  }
}
