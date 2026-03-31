export type WhatsAppProvider = 'evolution' | 'uazapi' | 'zpro';

export type ConnectionStatus = 'disconnected' | 'qr_code' | 'connecting' | 'connected';

export interface ConnectionConfig {
  provider: WhatsAppProvider;
  apiUrl: string;
  apiKey?: string;
  instanceName?: string;
  providerToken?: string;
}

export interface ConnectionInfo {
  id: string;
  name: string;
  provider: WhatsAppProvider;
  status: ConnectionStatus;
  phoneNumber?: string;
  phoneName?: string;
  phonePhoto?: string;
  webhookPath: string;
  isActive: boolean;
  connectedAt?: Date;
}

export interface QRCodeResult {
  qrcode?: string;
  pairingCode?: string;
  status: ConnectionStatus;
}
