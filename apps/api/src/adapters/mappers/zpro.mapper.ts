import { AudioMessage } from '../../domain/entities/audio-message.entity';

export interface ZproWebhookPayload {
  event?: string;
  messageId?: string;
  keyId?: string;
  phone?: string;
  fromMe?: boolean;
  isGroup?: boolean;
  audio?: string;
  momment?: string;
  timestamp?: number;
  type?: string;
  instanceId?: string;
}

export class ZproMapper {
  static toAudioMessage(payload: ZproWebhookPayload, connectionId: string): AudioMessage | null {
    const type = (payload.type || payload.event || '').toLowerCase();
    if (!['audio', 'ptt', 'voice'].includes(type)) return null;

    const messageId = payload.messageId || payload.keyId;
    const remoteJid = payload.phone;

    if (!messageId || !remoteJid) return null;

    return {
      connectionId,
      provider: 'zpro',
      messageId,
      remoteJid,
      isGroup: payload.isGroup ?? false,
      fromMe: payload.fromMe ?? false,
      mediaUrl: payload.audio,
      timestamp: payload.timestamp
        ? new Date(payload.timestamp)
        : new Date(),
    };
  }
}
