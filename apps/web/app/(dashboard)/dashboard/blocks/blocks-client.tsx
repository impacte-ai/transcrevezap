'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

interface BlockedUser {
  userJid: string;
  reason?: string;
}

function formatPhone(jid: string): string {
  const num = jid.replace(/@.*$/, '');
  if (num.length === 13 && num.startsWith('55')) {
    const ddd = num.slice(2, 4);
    const part1 = num.slice(4, 9);
    const part2 = num.slice(9);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }
  if (num.length === 12 && num.startsWith('55')) {
    const ddd = num.slice(2, 4);
    const part1 = num.slice(4, 8);
    const part2 = num.slice(8);
    return `+55 (${ddd}) ${part1}-${part2}`;
  }
  return jid;
}

export function BlocksClient({ blocked }: { blocked: BlockedUser[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [userJid, setUserJid] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userJid.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userJid: userJid.trim(), reason: reason.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Erro ao bloquear usuario');
      setUserJid('');
      setReason('');
      setShowForm(false);
      showMsg('success', 'Usuario bloqueado com sucesso');
      router.refresh();
    } catch {
      showMsg('error', 'Erro ao bloquear usuario');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnblock(jid: string) {
    try {
      const res = await fetch(`/api/blocks/${encodeURIComponent(jid)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao desbloquear');
      setConfirmDelete(null);
      showMsg('success', 'Usuario desbloqueado com sucesso');
      router.refresh();
    } catch {
      showMsg('error', 'Erro ao desbloquear usuario');
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
          Bloquear Usuario
        </button>
      ) : (
        <form onSubmit={handleAdd} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Numero</label>
            <input
              type="text"
              value={userJid}
              onChange={(e) => setUserJid(e.target.value)}
              placeholder="5511999999999@s.whatsapp.net"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Motivo do bloqueio"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Bloqueando...' : 'Bloquear'}
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

      {blocked.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Numero</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Motivo</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blocked.map((u) => (
                <tr key={u.userJid} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-foreground">{formatPhone(u.userJid)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.reason || '\u2014'}</td>
                  <td className="px-4 py-3 text-right">
                    {confirmDelete === u.userJid ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs text-red-600">Confirmar?</span>
                        <button
                          onClick={() => handleUnblock(u.userJid)}
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
                        onClick={() => setConfirmDelete(u.userJid)}
                        className="text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
                      >
                        Desbloquear
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
