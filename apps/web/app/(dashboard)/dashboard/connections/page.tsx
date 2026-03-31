import { api } from '@/lib/api';
import { ProviderBadge } from '@/components/provider-badge';
import { ConnectionStatusBadge } from '@/components/connection-status-badge';
import { Cable } from 'lucide-react';

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Conexões</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie suas instâncias WhatsApp</p>
        </div>
      </div>

      {connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
          <Cable className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhuma conexão configurada</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Adicione sua primeira instância WhatsApp</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provedor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Webhook</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {connections.map((conn) => (
                <tr key={conn.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{conn.name}</td>
                  <td className="px-4 py-3"><ProviderBadge provider={conn.provider} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{conn.phoneNumber || '—'}</td>
                  <td className="px-4 py-3"><ConnectionStatusBadge status={conn.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{conn.webhookPath}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
