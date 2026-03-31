import { api } from '@/lib/api';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  let groups: Array<{ groupJid: string; name?: string }> = [];
  try {
    groups = await api('/groups/allowed');
  } catch {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Grupos Permitidos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie quais grupos podem usar a transcrição</p>
      </div>
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
          <Users className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum grupo permitido</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Todos os grupos estão bloqueados por padrão</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">JID do Grupo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g) => (
                <tr key={g.groupJid} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{g.groupJid}</td>
                  <td className="px-4 py-3 text-foreground">{g.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
