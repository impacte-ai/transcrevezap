import { UserCog } from 'lucide-react';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuários & RBAC</h1>
        <p className="text-sm text-muted-foreground">Gerencie usuários, roles e permissões</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <UserCog className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">Gestão de usuários</p>
        <p className="mt-1 text-sm text-muted-foreground">CRUD de usuários e roles customizáveis</p>
      </div>
    </div>
  );
}
