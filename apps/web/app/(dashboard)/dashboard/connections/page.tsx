import { api } from '@/lib/api';
import { ConnectionsClient } from './connections-client';

interface Connection {
  id: string;
  name: string;
  provider: string;
  status: string;
  phoneNumber?: string;
  phoneName?: string;
  webhookPath: string;
  isActive: boolean;
  connectedAt?: string;
  createdAt: string;
}

export const dynamic = 'force-dynamic';

export default async function ConnectionsPage() {
  let connections: Connection[] = [];

  try {
    connections = await api<Connection[]>('/connections');
  } catch (error) {
    console.error('Erro ao carregar conexões:', error);
  }

  return <ConnectionsClient initialConnections={connections} />;
}
