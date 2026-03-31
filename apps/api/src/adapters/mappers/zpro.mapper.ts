import { AudioMessage } from '../../domain/entities/audio-message.entity';

export interface ZproWebhookPayload {
  // ZPRO webhook fields (based on API patterns, field names may vary)
  event?: string;
  type?: string;
  messageId?: string;
  keyId?: string;
  id?: string;
  // Phone/number — ZPRO uses 'number' in outbound, may use either in webhooks
  phone?: string;
  number?: string;
  from?: string;
  fromMe?: boolean;
  isGroup?: boolean;
  // Audio URL
  audio?: string;
  mediaUrl?: string;
  fileUrl?: string;
  // Metadata
  momment?: string;
  moment?: string;
  timestamp?: number;
  instanceId?: string;
  // Body text (for text messages)
  body?: string;
}

export class ZproMapper {
  static toAudioMessage(payload: ZproWebhookPayload, connectionId: string): AudioMessage | null {
    const type = (payload.type || payload.event || '').toLowerCase();
    if (!['audio', 'ptt', 'voice', 'audiomessage'].includes(type)) return null;

    const messageId = payload.messageId || payload.keyId || payload.id;
    // Try multiple field names for phone number
    const remoteJid = payload.phone || payload.number || payload.from;

    if (!messageId || !remoteJid) return null;

    // Audio URL from multiple possible fields
    const mediaUrl = payload.audio || payload.mediaUrl || payload.fileUrl;

    return {
      connectionId,
      provider: 'zpro',
      messageId,
      remoteJid,
      isGroup: payload.isGroup ?? false,
      fromMe: payload.fromMe ?? false,
      mediaUrl,
      timestamp: payload.timestamp
        ? new Date(payload.timestamp)
        : new Date(),
    };
  }
}
