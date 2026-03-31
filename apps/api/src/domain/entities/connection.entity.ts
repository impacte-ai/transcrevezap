export type WhatsAppProvider = 'evolution' | 'uazapi' | 'zpro';
export type ConnectionStatus = 'disconnected' | 'qr_code' | 'connecting' | 'connected';

export interface ConnectionEntity {
  id: string;
  name: string;
  provider: WhatsAppProvider;
  status: ConnectionStatus;
  apiUrl: string;
  apiKey?: string;
  instanceName?: string;
  providerToken?: string;
  phoneNumber?: string;
  phoneName?: string;
  phonePhoto?: string;
  webhookPath: string;
  isActive: boolean;
  connectedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QRCodeResult {
  qrcode?: string;
  pairingCode?: string;
  status: ConnectionStatus;
}
