import { AudioMessage } from '../../domain/entities/audio-message.entity';

export interface EvolutionWebhookPayload {
  server_url?: string;
  instance?: string;
  apikey?: string;
  data?: {
    key?: {
      id?: string;
      fromMe?: boolean;
      remoteJid?: string;
    };
    messageType?: string;
    message?: {
      mediaUrl?: string;
      audioMessage?: Record<string, unknown>;
    };
    messageTimestamp?: number;
  };
}

export class EvolutionMapper {
  static toAudioMessage(payload: EvolutionWebhookPayload, connectionId: string): AudioMessage | null {
    const data = payload.data;
    if (!data?.key?.id || !data.key.remoteJid) return null;
    if (data.messageType !== 'audioMessage') return null;

    const remoteJid = data.key.remoteJid;
    const isGroup = remoteJid.endsWith('@g.us');

    return {
      connectionId,
      provider: 'evolution',
      messageId: data.key.id,
      remoteJid,
      isGroup,
      fromMe: data.key.fromMe ?? false,
      mediaUrl: data.message?.mediaUrl,
      serverUrl: payload.server_url,
      apiKey: payload.apikey,
      instanceName: payload.instance,
      timestamp: data.messageTimestamp
        ? new Date(data.messageTimestamp * 1000)
        : new Date(),
    };
  }
}
