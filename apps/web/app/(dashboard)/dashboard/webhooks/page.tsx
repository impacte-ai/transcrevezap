import { api } from '@/lib/api';
import { Webhook } from 'lucide-react';
import { WebhooksClient } from './webhooks-client';

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
          <p className="mt-1 text-sm text-muted-foreground">Distribua webhooks para multiplos destinos</p>
        </div>
      </div>

      {webhooks.length === 0 ? (
        <div className="space-y-6">
          <WebhooksClient webhooks={webhooks} />
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
            <Webhook className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum webhook configurado</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Adicione URLs para distribuir seus webhooks</p>
          </div>
        </div>
      ) : (
        <WebhooksClient webhooks={webhooks} />
      )}
    </div>
  );
}
