'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Cable, Plus, Play, Square, Trash2, X, Loader2 } from 'lucide-react';
import { ProviderBadge } from '@/components/provider-badge';
import { ConnectionStatusBadge } from '@/components/connection-status-badge';

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

type Provider = 'evolution' | 'uazapi' | 'zpro';

const providerOptions: { value: Provider; label: string }[] = [
  { value: 'evolution', label: 'Evolution API' },
  { value: 'uazapi', label: 'UAZAPI' },
  { value: 'zpro', label: 'ZPRO' },
];

const providerFields: Record<Provider, { key: string; label: string; type?: string }[]> = {
  evolution: [
    { key: 'apiUrl', label: 'URL da API' },
    { key: 'apiKey', label: 'Chave da API' },
    { key: 'instanceName', label: 'Nome da Instância' },
  ],
  uazapi: [
    { key: 'serverUrl', label: 'URL do Servidor' },
    { key: 'token', label: 'Token de Acesso' },
  ],
  zpro: [
    { key: 'apiUrl', label: 'URL da API' },
    { key: 'bearerToken', label: 'Bearer Token' },
    { key: 'apiId', label: 'API ID' },
  ],
};

export function ConnectionsClient({ initialConnections }: { initialConnections: Connection[] }) {
  const router = useRouter();
  const [connections, setConnections] = useState(initialConnections);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState<Provider>('evolution');
  const [formFields, setFormFields] = useState<Record<string, string>>({});

  const refreshConnections = useCallback(async () => {
    try {
      const res = await fetch('/api/connections');
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } catch {
      // silent refresh failure
    }
  }, []);

  // Auto-refresh polling every 10 seconds
  useEffect(() => {
    const interval = setInterval(refreshConnections, 10000);
    return () => clearInterval(interval);
  }, [refreshConnections]);

  // Update connections when initialConnections changes (server refresh)
  useEffect(() => {
    setConnections(initialConnections);
  }, [initialConnections]);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function resetForm() {
    setFormName('');
    setFormProvider('evolution');
    setFormFields({});
    setShowModal(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          provider: formProvider,
          config: formFields,
        }),
      });

      if (res.ok) {
        showMessage('success', 'Conexão criada com sucesso!');
        resetForm();
        await refreshConnections();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage('error', data.message || 'Erro ao criar conexão');
      }
    } catch {
      showMessage('error', 'Erro ao criar conexão');
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/connections/${id}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        showMessage('success', 'Conexão iniciada!');
        await refreshConnections();
        router.refresh();
      } else {
        showMessage('error', 'Erro ao conectar');
      }
    } catch {
      showMessage('error', 'Erro ao conectar');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDisconnect(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/connections/${id}/disconnect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        showMessage('success', 'Conexão encerrada!');
        await refreshConnections();
        router.refresh();
      } else {
        showMessage('error', 'Erro ao desconectar');
      }
    } catch {
      showMessage('error', 'Erro ao desconectar');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/connections/${id}`, { method: 'DELETE' });

      if (res.ok) {
        showMessage('success', 'Conexão excluída com sucesso!');
        setDeleteConfirm(null);
        await refreshConnections();
        router.refresh();
      } else {
        showMessage('error', 'Erro ao excluir conexão');
      }
    } catch {
      showMessage('error', 'Erro ao excluir conexão');
    } finally {
      setActionLoading(null);
    }
  }

  const currentFields = providerFields[formProvider];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Conexões</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie suas instâncias WhatsApp</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nova Conexão
        </button>
      </div>

      {/* Toast message */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Connections table or empty state */}
      {connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
          <Cable className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhuma conexão configurada</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Adicione sua primeira instância WhatsApp</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nova Conexão
          </button>
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
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
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
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {conn.status === 'connected' ? (
                        <button
                          onClick={() => handleDisconnect(conn.id)}
                          disabled={actionLoading === conn.id}
                          className="rounded-lg p-2 text-yellow-600 transition-colors hover:bg-yellow-50 disabled:opacity-50"
                          title="Desconectar"
                        >
                          {actionLoading === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnect(conn.id)}
                          disabled={actionLoading === conn.id}
                          className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
                          title="Conectar"
                        >
                          {actionLoading === conn.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(conn.id)}
                        disabled={actionLoading === conn.id}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Excluir Conexão</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tem certeza que deseja excluir esta conexão? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === deleteConfirm && <Loader2 className="h-4 w-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create connection modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Nova Conexão</h3>
              <button
                onClick={resetForm}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Nome da Conexão
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: WhatsApp Principal"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Provedor
                </label>
                <select
                  value={formProvider}
                  onChange={(e) => {
                    setFormProvider(e.target.value as Provider);
                    setFormFields({});
                  }}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {providerOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 rounded-xl bg-secondary/30 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Configuração do Provedor
                </p>
                {currentFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={formFields[field.key] || ''}
                      onChange={(e) =>
                        setFormFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formName.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
