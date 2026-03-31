'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog, Plus, Pencil, Trash2, Key, X, Loader2 } from 'lucide-react';

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

type ModalType = 'create' | 'edit' | 'password' | null;

export function UsersClient({ initialUsers, initialRoles }: { initialUsers: User[]; initialRoles: Role[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [roles] = useState(initialRoles);
  const [modal, setModal] = useState<ModalType>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRoleId, setFormRoleId] = useState('');

  const refreshUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      // silent
    }
  }, []);

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  function openCreate() {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRoleId(roles[0]?.id || '');
    setEditingUser(null);
    setModal('create');
  }

  function openEdit(user: User) {
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRoleId(user.roleId);
    setEditingUser(user);
    setModal('edit');
  }

  function openPassword(user: User) {
    setFormPassword('');
    setEditingUser(user);
    setModal('password');
  }

  function closeModal() {
    setModal(null);
    setEditingUser(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim() || !formRoleId) return;

    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword,
          roleId: formRoleId,
        }),
      });

      if (res.ok) {
        showMessage('success', 'Usuário criado com sucesso!');
        closeModal();
        await refreshUsers();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage('error', data.message || 'Erro ao criar usuário');
      }
    } catch {
      showMessage('error', 'Erro ao criar usuário');
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser || !formName.trim() || !formEmail.trim() || !formRoleId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          email: formEmail.trim(),
          roleId: formRoleId,
        }),
      });

      if (res.ok) {
        showMessage('success', 'Usuário atualizado com sucesso!');
        closeModal();
        await refreshUsers();
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage('error', data.message || 'Erro ao atualizar usuário');
      }
    } catch {
      showMessage('error', 'Erro ao atualizar usuário');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser || !formPassword.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${editingUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: formPassword }),
      });

      if (res.ok) {
        showMessage('success', 'Senha alterada com sucesso!');
        closeModal();
      } else {
        showMessage('error', 'Erro ao alterar senha');
      }
    } catch {
      showMessage('error', 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(user: User) {
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (res.ok) {
        showMessage('success', user.isActive ? 'Usuário desativado' : 'Usuário ativado');
        await refreshUsers();
        router.refresh();
      } else {
        showMessage('error', 'Erro ao alterar status');
      }
    } catch {
      showMessage('error', 'Erro ao alterar status');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });

      if (res.ok) {
        showMessage('success', 'Usuário excluído com sucesso!');
        setDeleteConfirm(null);
        await refreshUsers();
        router.refresh();
      } else {
        showMessage('error', 'Erro ao excluir usuário');
      }
    } catch {
      showMessage('error', 'Erro ao excluir usuário');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie usuarios, roles e permissoes</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Novo Usuario
        </button>
      </div>

      {/* Toast message */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Users table or empty state */}
      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
          <UserCog className="h-12 w-12 text-muted-foreground/40" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum usuario cadastrado</p>
          <p className="mt-1 text-sm text-muted-foreground/70">Adicione o primeiro usuario do sistema</p>
          <button
            onClick={openCreate}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Novo Usuario
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                      {user.role?.name || 'Sem role'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(user)}
                      disabled={actionLoading === user.id}
                      className="inline-flex items-center gap-2 text-xs font-medium transition-colors disabled:opacity-50"
                      title={user.isActive ? 'Clique para desativar' : 'Clique para ativar'}
                    >
                      {actionLoading === user.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className={`h-2.5 w-2.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      )}
                      <span className={user.isActive ? 'text-green-700' : 'text-gray-500'}>
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(user)}
                        className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openPassword(user)}
                        className="rounded-lg p-2 text-yellow-600 transition-colors hover:bg-yellow-50"
                        title="Alterar senha"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(user.id)}
                        disabled={actionLoading === user.id}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-foreground">Excluir Usuario</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tem certeza que deseja excluir este usuario? Esta acao ira remover o usuario de todos os sistemas e nao pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === deleteConfirm && <Loader2 className="h-4 w-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Novo Usuario</h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nome completo"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Senha do usuario"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                <select
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="" disabled>Selecione uma role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}{role.description ? ` - ${role.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formName.trim() || !formEmail.trim() || !formPassword.trim() || !formRoleId}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit user modal */}
      {modal === 'edit' && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Editar Usuario</h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEdit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
                <select
                  value={formRoleId}
                  onChange={(e) => setFormRoleId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}{role.description ? ` - ${role.description}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formName.trim() || !formEmail.trim() || !formRoleId}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change password modal */}
      {modal === 'password' && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Alterar Senha</h3>
              <button
                onClick={closeModal}
                className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Alterando senha de <span className="font-medium text-foreground">{editingUser.name}</span>
            </p>

            <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Nova Senha</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Digite a nova senha"
                  required
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !formPassword.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Alterar Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
