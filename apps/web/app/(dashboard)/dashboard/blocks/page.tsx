import { api } from '@/lib/api';
import { ShieldBan } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BlocksPage() {
  let blocked: Array<{ userJid: string; reason?: string }> = [];
  try {
    blocked = await api('/users/blocked');
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários Bloqueados</h1>
        <p className="text-sm text-muted-foreground">Gerencie usuários que não podem usar a transcrição</p>
      </div>
      {blocked.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <ShieldBan className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum usuário bloqueado</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Número</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {blocked.map((u) => (
                <tr key={u.userJid} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-mono text-sm text-foreground">{u.userJid}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
