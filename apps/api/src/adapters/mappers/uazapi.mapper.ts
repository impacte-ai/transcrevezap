import { AudioMessage } from '../../domain/entities/audio-message.entity';

export interface UazapiWebhookPayload {
  token?: string;
  EventType?: string;
  event?: string;
  // UAZAPI nests message data under 'message' key
  message?: {
    messageType?: string;
    MessageType?: string;
    id?: string;
    messageid?: string;
    sender_pn?: string;
    sender?: string;
    chatid?: string;
    fromMe?: boolean;
    isGroup?: boolean;
    isGroupMsg?: boolean;
    content?: {
      URL?: string;
      url?: string;
      mimetype?: string;
    };
    messageTimestamp?: number;
    timestamp?: number;
  };
  chat?: {
    wa_chatid?: string;
    chatid?: string;
  };
  // Some UAZAPI versions may send flat (for backward compat)
  MessageType?: string;
  wa_message_id?: string;
  messageId?: string;
  sender_pn?: string;
  sender?: string;
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
    // UAZAPI sends data nested under 'message' key, with fallback to root level
    const msg = payload.message || {};
    const chat = payload.chat || {};

    const messageType = (
      msg.messageType || msg.MessageType ||
      payload.MessageType || ''
    ).toLowerCase();

    if (!['audio', 'ptt', 'audiomessage', 'voice'].includes(messageType)) return null;

    // Message ID: UAZAPI uses 'messageid' (lowercase) or 'id'
    const messageId = msg.messageid || msg.id || payload.wa_message_id || payload.messageId;

    // Sender
    const sender = msg.sender_pn || msg.sender || payload.sender_pn || payload.sender;

    // Chat ID
    const chatId = chat.wa_chatid || chat.chatid || msg.chatid || payload.wa_chatid || payload.chatid;

    const remoteJid = chatId || sender;
    if (!messageId || !remoteJid) return null;

    const isGroup = remoteJid.endsWith('@g.us') ||
      msg.isGroup === true || msg.isGroupMsg === true ||
      payload.isGroupMsg === true;

    // Media URL
    const content = msg.content || payload.content;
    const mediaUrl = content?.URL || content?.url;

    // Timestamp
    const msgTimestamp = msg.messageTimestamp || payload.messageTimestamp;
    const rawTs = msg.timestamp || payload.timestamp;
    const ts = msgTimestamp
      ? new Date(msgTimestamp * 1000)
      : rawTs
        ? new Date(rawTs)
        : new Date();

    return {
      connectionId,
      provider: 'uazapi',
      messageId,
      remoteJid,
      isGroup,
      fromMe: msg.fromMe ?? payload.fromMe ?? false,
      mediaUrl,
      mimetype: content?.mimetype,
      providerToken: payload.token,
      timestamp: ts,
    };
  }
}
