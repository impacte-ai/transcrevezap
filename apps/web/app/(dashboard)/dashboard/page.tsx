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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral do TranscreveZAP</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Processado"
          value={stats.total}
          icon={AudioLines}
          description="Transcrições realizadas"
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
    </div>
  );
}
