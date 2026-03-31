import { AudioMessage } from '../../domain/entities/audio-message.entity';

export interface UazapiWebhookPayload {
  token?: string;
  EventType?: string;
  MessageType?: string;
  messageId?: string;
  wa_message_id?: string;
  sender_pn?: string;
  sender?: string;
  from?: string;
  wa_chatid?: string;
  chatid?: string;
  fromMe?: boolean;
  isGroupMsg?: boolean;
  content?: {
    URL?: string;
    url?: string;
    mimetype?: string;
  };
  messageTimestamp?: number;
  timestamp?: number;
}

export class UazapiMapper {
  static toAudioMessage(payload: UazapiWebhookPayload, connectionId: string): AudioMessage | null {
    const messageType = (payload.MessageType || '').toLowerCase();
    if (!['audio', 'ptt', 'audiomessage'].includes(messageType)) return null;

    const messageId = payload.wa_message_id || payload.messageId;
    const sender = payload.sender_pn || payload.sender || payload.from;
    const chatId = payload.wa_chatid || payload.chatid;
    const remoteJid = chatId || sender;

    if (!messageId || !remoteJid) return null;

    const isGroup = remoteJid.endsWith('@g.us') || payload.isGroupMsg === true;
    const mediaUrl = payload.content?.URL || payload.content?.url;

    const ts = payload.messageTimestamp
      ? new Date(payload.messageTimestamp * 1000)
      : payload.timestamp
        ? new Date(payload.timestamp)
        : new Date();

    return {
      connectionId,
      provider: 'uazapi',
      messageId,
      remoteJid,
      isGroup,
      fromMe: payload.fromMe ?? false,
      mediaUrl,
      mimetype: payload.content?.mimetype,
      providerToken: payload.token,
      timestamp: ts,
    };
  }
}
