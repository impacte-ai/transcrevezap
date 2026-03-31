import { api } from '@/lib/api';
import { Users } from 'lucide-react';
import { GroupsClient } from './groups-client';

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
        <p className="mt-1 text-sm text-muted-foreground">Gerencie quais grupos podem usar a transcricao</p>
      </div>

      {groups.length === 0 ? (
        <div className="space-y-6">
          <GroupsClient groups={groups} />
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
            <Users className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum grupo permitido</p>
            <p className="mt-1 text-sm text-muted-foreground/70">Todos os grupos estao bloqueados por padrao</p>
          </div>
        </div>
      ) : (
        <GroupsClient groups={groups} />
      )}
    </div>
  );
}
