import { ConnectionEntity, QRCodeResult, WhatsAppProvider } from '../../entities/connection.entity';

export interface CreateConnectionData {
  name: string;
  provider: WhatsAppProvider;
  apiUrl: string;
  apiKey?: string;
  instanceName?: string;
  providerToken?: string;
}

export interface ConnectionUseCase {
  getAll(): Promise<ConnectionEntity[]>;
  getById(id: string): Promise<ConnectionEntity | null>;
  create(data: CreateConnectionData): Promise<ConnectionEntity>;
  update(id: string, data: Partial<ConnectionEntity>): Promise<ConnectionEntity>;
  delete(id: string): Promise<void>;
  connect(id: string, phoneNumber?: string): Promise<QRCodeResult>;
  disconnect(id: string): Promise<void>;
  getStatus(id: string): Promise<{ connected: boolean; phoneNumber?: string }>;
}

export const CONNECTION_USE_CASE = Symbol('ConnectionUseCase');
