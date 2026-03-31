import { api } from '@/lib/api';
import { Webhook, CheckCircle, AlertCircle } from 'lucide-react';

interface WebhookRedirect {
  id: string;
  url: string;
  description?: string;
  isActive: boolean;
  successCount: number;
  errorCount: number;
  lastSuccess?: string;
  lastError?: string;
  lastErrorMsg?: string;
}

export const dynamic = 'force-dynamic';

export default async function WebhooksPage() {
  let webhooks: WebhookRedirect[] = [];
  try {
    webhooks = await api<WebhookRedirect[]>('/webhooks');
  } catch (error) {
    console.error('Erro ao carregar webhooks:', error);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Webhook Hub</h1>
          <p className="mt-1 text-sm text-muted-foreground">Distribua webhooks para múltiplos destinos</p>
        </div>
      </div>

      {webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
          <Webhook className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum webhook configurado</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Adicione URLs para distribuir seus webhooks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => {
            const total = wh.successCount + wh.errorCount;
            const successRate = total > 0 ? Math.round((wh.successCount / total) * 100) : 0;
            const isHealthy = successRate >= 80;

            return (
              <div key={wh.id} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-mono text-sm text-foreground">{wh.url}</p>
                    {wh.description && <p className="text-xs text-muted-foreground">{wh.description}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isHealthy ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-muted-foreground">{successRate}%</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span>Sucesso: {wh.successCount}</span>
                  <span>Erros: {wh.errorCount}</span>
                  {wh.lastErrorMsg && <span className="text-red-500">Último erro: {wh.lastErrorMsg}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
