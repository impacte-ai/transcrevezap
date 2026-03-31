export interface AudioMessage {
  connectionId: string;
  provider: string;
  messageId: string;
  remoteJid: string;
  isGroup: boolean;
  fromMe: boolean;
  mediaUrl?: string;
  base64Data?: string;
  mimetype?: string;
  // Provider-specific auth (passed through from connection)
  serverUrl?: string;
  apiKey?: string;
  instanceName?: string;
  providerToken?: string;
  timestamp: Date;
}
