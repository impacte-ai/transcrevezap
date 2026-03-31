import { api } from '@/lib/api';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  let groups: Array<{ groupJid: string; name?: string }> = [];
  try {
    groups = await api('/groups/allowed');
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grupos Permitidos</h1>
        <p className="text-sm text-muted-foreground">Gerencie quais grupos podem usar a transcrição</p>
      </div>
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
          <Users className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum grupo permitido</p>
          <p className="mt-1 text-sm text-muted-foreground">Todos os grupos estão bloqueados por padrão</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">JID do Grupo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g) => (
                <tr key={g.groupJid} className="hover:bg-secondary/30">
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
