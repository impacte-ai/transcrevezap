import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { MessagingPort, SendTextOptions } from '../../../domain/ports/outbound/messaging.port';
import { MediaPort, MediaDownloadResult } from '../../../domain/ports/outbound/media.port';

@Injectable()
export class EvolutionMessagingAdapter implements MessagingPort, MediaPort {
  private readonly logger = new Logger(EvolutionMessagingAdapter.name);

  private apiUrl: string = '';
  private apiKey: string = '';
  private instanceName: string = '';

  configure(apiUrl: string, apiKey: string, instanceName: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.instanceName = instanceName;
  }

  private get headers() {
    return { apikey: this.apiKey, 'Content-Type': 'application/json' };
  }

  async sendText(options: SendTextOptions): Promise<{ messageId: string }> {
    const url = `${this.apiUrl}/message/sendText/${this.instanceName}`;

    // Try V2 format first, fallback to V1
    try {
      const body: Record<string, unknown> = {
        number: options.to,
        text: options.text,
        options: { delay: 1200, presence: 'composing', linkPreview: false },
      };

      if (options.replyToMessageId) {
        body.quoted = {
          key: { remoteJid: options.to, fromMe: false, id: options.replyToMessageId },
        };
      }

      const response = await axios.post(url, body, { headers: this.headers, timeout: 15000 });
      return { messageId: response.data?.key?.id || response.data?.messageId || 'sent' };
    } catch (error: any) {
      // Fallback to V1 format
      const body: Record<string, unknown> = {
        number: options.to,
        options: { delay: 1200, presence: 'composing', linkPreview: false },
        textMessage: { text: options.text },
      };

      const response = await axios.post(url, body, { headers: this.headers, timeout: 15000 });
      return { messageId: response.data?.key?.id || 'sent' };
    }
  }

  async downloadAudio(messageId: string): Promise<MediaDownloadResult> {
    // Evolution API: download via mediaUrl or getBase64
    return this.getBase64Audio(messageId);
  }

  async getBase64Audio(messageId: string): Promise<MediaDownloadResult> {
    const url = `${this.apiUrl}/chat/getBase64FromMediaMessage/${this.instanceName}`;
    const body = {
      message: { key: { id: messageId } },
      convertToMp4: false,
    };

    const response = await axios.post(url, body, { headers: this.headers, timeout: 60000 });
    const base64 = response.data?.base64;

    if (!base64) throw new Error('Falha ao obter áudio base64 da Evolution API');

    const buffer = Buffer.from(base64, 'base64');
    return { buffer, mimetype: response.data?.mimetype || 'audio/ogg' };
  }

  async fetchGroups(): Promise<Array<{ id: string; name: string }>> {
    const url = `${this.apiUrl}/group/fetchAllGroups/${this.instanceName}?getParticipants=false`;
    const response = await axios.get(url, { headers: this.headers, timeout: 15000 });

    return (response.data || []).map((g: any) => ({
      id: g.id,
      name: g.subject || g.name || g.id,
    }));
  }

  async getInstanceStatus(): Promise<{ connected: boolean; phoneNumber?: string }> {
    try {
      const url = `${this.apiUrl}/instance/connectionState/${this.instanceName}`;
      const response = await axios.get(url, { headers: this.headers, timeout: 10000 });
      const state = response.data?.state || response.data?.instance?.state;
      return { connected: state === 'open', phoneNumber: response.data?.instance?.owner };
    } catch {
      return { connected: false };
    }
  }

  async connectInstance(phoneNumber?: string): Promise<{ qrcode?: string; pairingCode?: string }> {
    const url = `${this.apiUrl}/instance/connect/${this.instanceName}`;
    const response = await axios.get(url, { headers: this.headers, timeout: 30000 });
    return {
      qrcode: response.data?.base64 || response.data?.qrcode,
      pairingCode: response.data?.pairingCode,
    };
  }

  async disconnectInstance(): Promise<void> {
    const url = `${this.apiUrl}/instance/logout/${this.instanceName}`;
    await axios.delete(url, { headers: this.headers, timeout: 10000 });
  }
}
