import { api } from '@/lib/api';
import { UsersClient } from './users-client';

interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  permissions: { id: string; entity: string; actions: string }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  roleId: string;
  role: Role;
  createdAt: string;
}

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  let users: User[] = [];
  let roles: Role[] = [];

  try {
    [users, roles] = await Promise.all([
      api<User[]>('/users'),
      api<Role[]>('/users/roles'),
    ]);
  } catch (error) {
    console.error('Erro ao carregar usuarios:', error);
  }

  return <UsersClient initialUsers={users} initialRoles={roles} />;
}
