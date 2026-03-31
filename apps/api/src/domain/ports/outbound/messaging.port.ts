export interface SendTextOptions {
  to: string;
  text: string;
  replyToMessageId?: string;
}

export interface MessagingPort {
  sendText(options: SendTextOptions): Promise<{ messageId: string }>;
  fetchGroups(): Promise<Array<{ id: string; name: string }>>;
  getInstanceStatus(): Promise<{ connected: boolean; phoneNumber?: string }>;
  connectInstance(phoneNumber?: string): Promise<{ qrcode?: string; pairingCode?: string }>;
  disconnectInstance(): Promise<void>;
}

export const MESSAGING_PORT = Symbol('MessagingPort');
