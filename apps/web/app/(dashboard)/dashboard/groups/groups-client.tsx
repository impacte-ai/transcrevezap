'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

interface Group {
  groupJid: string;
  name?: string;
}

export function GroupsClient({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [groupJid, setGroupJid] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function showMsg(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!groupJid.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupJid: groupJid.trim(), name: name.trim() || undefined }),
      });
      if (!res.ok) throw new Error('Erro ao adicionar grupo');
      setGroupJid('');
      setName('');
      setShowForm(false);
      showMsg('success', 'Grupo adicionado com sucesso');
      router.refresh();
    } catch {
      showMsg('error', 'Erro ao adicionar grupo');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(jid: string) {
    try {
      const res = await fetch(`/api/groups/${encodeURIComponent(jid)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao remover grupo');
      setConfirmDelete(null);
      showMsg('success', 'Grupo removido com sucesso');
      router.refresh();
    } catch {
      showMsg('error', 'Erro ao remover grupo');
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
          Adicionar Grupo
        </button>
      ) : (
        <form onSubmit={handleAdd} className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">JID do Grupo</label>
            <input
              type="text"
              value={groupJid}
              onChange={(e) => setGroupJid(e.target.value)}
              placeholder="123456789@g.us"
              required
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Nome (opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do grupo"
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

      {groups.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">JID do Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g) => (
                <tr key={g.groupJid} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{g.groupJid}</td>
                  <td className="px-4 py-3 text-foreground">{g.name || '\u2014'}</td>
                  <td className="px-4 py-3 text-right">
                    {confirmDelete === g.groupJid ? (
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs text-red-600">Confirmar?</span>
                        <button
                          onClick={() => handleDelete(g.groupJid)}
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
                        onClick={() => setConfirmDelete(g.groupJid)}
                        className="text-muted-foreground transition-colors hover:text-red-600"
                        title="Remover"
                      >
                        <Trash2 className="h-4 w-4" />
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
