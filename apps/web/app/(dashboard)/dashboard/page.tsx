import { api } from '@/lib/api';
import { StatsCard } from '@/components/stats-card';
import { AudioLines, Cable, CheckCircle, Clock } from 'lucide-react';

interface Stats {
  total: number;
  today: number;
  activeConnections: number;
  totalConnections: number;
}

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let stats: Stats = { total: 0, today: 0, activeConnections: 0, totalConnections: 0 };

  try {
    stats = await api<Stats>('/stats');
  } catch (error) {
    console.error('Erro ao carregar stats:', error);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie suas transcrições e conexões WhatsApp
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Processado"
          value={stats.total}
          icon={AudioLines}
          description="Transcrições realizadas"
          accent
        />
        <StatsCard
          title="Hoje"
          value={stats.today}
          icon={Clock}
          description="Transcrições hoje"
        />
        <StatsCard
          title="Conexões Ativas"
          value={stats.activeConnections}
          icon={Cable}
          description={`de ${stats.totalConnections} total`}
        />
        <StatsCard
          title="Taxa de Sucesso"
          value={stats.total > 0 ? '99%' : '—'}
          icon={CheckCircle}
        />
      </div>

      {/* Placeholder sections for future charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Transcrições por Dia</h2>
          <p className="mt-1 text-sm text-muted-foreground">Últimos 7 dias</p>
          <div className="mt-8 flex h-48 items-center justify-center text-muted-foreground/40">
            <p className="text-sm">Gráfico disponível com dados</p>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Conexões Recentes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Status das instâncias</p>
          <div className="mt-8 flex h-48 items-center justify-center text-muted-foreground/40">
            <p className="text-sm">Nenhuma conexão configurada</p>
          </div>
        </div>
      </div>
    </div>
  );
}
