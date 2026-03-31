import { UserCog } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Usuários & RBAC</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie usuários, roles e permissões</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
        <UserCog className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">Gestão de usuários</p>
        <p className="mt-1 text-sm text-muted-foreground/70">CRUD de usuários e roles customizáveis</p>
      </div>
    </div>
  );
}
