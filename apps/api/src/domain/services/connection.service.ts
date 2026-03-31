import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ConnectionEntity, QRCodeResult } from '../entities/connection.entity';
import { ConnectionUseCase, CreateConnectionData } from '../ports/inbound/connection.use-case';
import { STORAGE_PORT, StoragePort } from '../ports/outbound/storage.port';
import { CACHE_PORT, CachePort } from '../ports/outbound/cache.port';

@Injectable()
export class ConnectionService implements ConnectionUseCase {
  private readonly logger = new Logger(ConnectionService.name);

  constructor(
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
  ) {}

  async getAll(): Promise<ConnectionEntity[]> {
    return this.storage.findAllConnections();
  }

  async getById(id: string): Promise<ConnectionEntity | null> {
    return this.storage.findConnectionById(id);
  }

  async create(data: CreateConnectionData): Promise<ConnectionEntity> {
    const webhookPath = `/webhook/${data.provider}/${randomBytes(8).toString('hex')}`;
    this.logger.log(`Criando conexão ${data.name} (${data.provider}) — webhook: ${webhookPath}`);

    return this.storage.createConnection({
      ...data,
      status: 'disconnected',
      webhookPath,
      isActive: true,
    });
  }

  async update(id: string, data: Partial<ConnectionEntity>): Promise<ConnectionEntity> {
    return this.storage.updateConnection(id, data);
  }

  async delete(id: string): Promise<void> {
    this.logger.log(`Deletando conexão: ${id}`);
    await this.storage.deleteConnection(id);
  }

  async connect(id: string, phoneNumber?: string): Promise<QRCodeResult> {
    // Messaging adapter will handle actual QR code generation (Plan 3)
    this.logger.log(`Conectando instância: ${id}`);
    await this.storage.updateConnection(id, { status: 'qr_code' });
    return { status: 'qr_code' };
  }

  async disconnect(id: string): Promise<void> {
    this.logger.log(`Desconectando instância: ${id}`);
    await this.storage.updateConnection(id, { status: 'disconnected', phoneNumber: undefined, phoneName: undefined });
  }

  async getStatus(id: string): Promise<{ connected: boolean; phoneNumber?: string }> {
    const conn = await this.storage.findConnectionById(id);
    if (!conn) throw new Error(`Conexão não encontrada: ${id}`);
    return { connected: conn.status === 'connected', phoneNumber: conn.phoneNumber ?? undefined };
  }
}
