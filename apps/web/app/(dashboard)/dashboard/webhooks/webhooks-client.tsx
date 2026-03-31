'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface WebhookFailure {
  id: string;
  statusCode?: number;
  errorMessage?: string;
  createdAt: string;
}

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

export function WebhooksClient({ webhooks }: { webhooks: WebhookRedirect[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [expandedFailures, setExpandedFailures] = useState<string | null>(null);
  const [failures, setFailures] = useState<Record<string, WebhookFailure[]>>({});
  const [loadingFailures, setLoadingFailures] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), description: description.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Erro ao criar webhook');
      setUrl('');
      setDescription('');
      setShowForm(false);
      showMessage('success', 'Webhook adicionado com sucesso');
      router.refresh();
    } catch {
      showMessage('error', 'Erro ao adicionar webhook');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover webhook');
      setConfirmDelete(null);
      showMessage('success', 'Webhook removido com sucesso');
      router.refresh();
    } catch {
      showMessage('error', 'Erro ao remover webhook');
    }
  }

  async function toggleFailures(webhookId: string) {
    if (expandedFailures === webhookId) {
      setExpandedFailures(null);
      return;
    }
    setExpandedFailures(webhookId);
    if (!failures[webhookId]) {
      setLoadingFailures(webhookId);
      try {
        const res = await fetch(`/api/webhooks/${webhookId}/failures`);
        const data = await res.json();
        setFailures((prev) => ({ ...prev, [webhookId]: Array.isArray(data) ? data : [] }));
      } catch {
        setFailures((prev) => ({ ...prev, [webhookId]: [] }));
      } finally {
        setLoadingFailures(null);
      }
    }
  }

  async function handleRetry(webhookId: string, failureId: string) {
    setRetryingId(failureId);
    try {
      const res = await fetch(`/api/webhooks/${webhookId}/failures/${failureId}/retry`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erro ao reenviar');
      showMessage('success', 'Reenvio realizado com sucesso');
      // Reload failures
      const failRes = await fetch(`/api/webhooks/${webhookId}/failures`);
      const data = await failRes.json();
      setFailures((prev) => ({ ...prev, [webhookId]: Array.isArray(data) ? data : [] }));
      router.refresh();
    } catch {
      showMessage('error', 'Erro ao reenviar webhook');
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-opacity ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Adicionar Webhook
        </button>
      ) : (
        <form onSubmit={handleAdd} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://exemplo.com/webhook"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Descricao (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao do webhook"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {webhooks.map((wh) => {
          const total = wh.successCount + wh.errorCount;
          const successRate = total > 0 ? Math.round((wh.successCount / total) * 100) : 0;
          const isExpanded = expandedFailures === wh.id;
          const whFailures = failures[wh.id] || [];

          return (
            <div key={wh.id} className="rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="font-mono text-sm text-foreground truncate">{wh.url}</p>
                  {wh.description && <p className="text-xs text-muted-foreground">{wh.description}</p>}
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <div className="flex items-center gap-1.5">
                    {successRate >= 80 ? (
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-muted-foreground">{successRate}%</span>
                  </div>
                  {confirmDelete === wh.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600">Confirmar?</span>
                      <button
                        onClick={() => handleDelete(wh.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Sim
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Nao
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(wh.id)}
                      className="text-muted-foreground transition-colors hover:text-red-600"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span>Sucesso: {wh.successCount}</span>
                <span>Erros: {wh.errorCount}</span>
                {wh.lastErrorMsg && <span className="text-red-500">Ultimo erro: {wh.lastErrorMsg}</span>}
                {wh.errorCount > 0 && (
                  <button
                    onClick={() => toggleFailures(wh.id)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver Falhas
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className="mt-4 space-y-2">
                  {loadingFailures === wh.id ? (
                    <p className="text-xs text-muted-foreground">Carregando falhas...</p>
                  ) : whFailures.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma falha registrada</p>
                  ) : (
                    whFailures.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-2.5"
                      >
                        <div className="space-y-0.5">
                          {f.statusCode && (
                            <span className="text-xs font-mono text-red-500">HTTP {f.statusCode}</span>
                          )}
                          <p className="text-xs text-muted-foreground">{f.errorMessage || 'Erro desconhecido'}</p>
                          <p className="text-xs text-muted-foreground/60">
                            {new Date(f.createdAt).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRetry(wh.id, f.id)}
                          disabled={retryingId === f.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 disabled:opacity-50"
                        >
                          <RefreshCw className={`h-3 w-3 ${retryingId === f.id ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
