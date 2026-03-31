import { api } from '@/lib/api';
import { ShieldBan } from 'lucide-react';
import { BlocksClient } from './blocks-client';

export const dynamic = 'force-dynamic';

export default async function BlocksPage() {
  let blocked: Array<{ userJid: string; reason?: string }> = [];
  try {
    blocked = await api('/users/blocked');
  } catch {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Usuarios Bloqueados</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie usuarios que nao podem usar a transcricao</p>
      </div>

      {blocked.length === 0 ? (
        <div className="space-y-6">
          <BlocksClient blocked={blocked} />
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
            <ShieldBan className="h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum usuario bloqueado</p>
          </div>
        </div>
      ) : (
        <BlocksClient blocked={blocked} />
      )}
    </div>
  );
}
