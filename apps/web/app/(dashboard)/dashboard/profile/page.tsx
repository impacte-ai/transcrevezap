'use client';

import { useState, useEffect } from 'react';
import { User, Key, Mail, Loader2 } from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  email: string;
  role: { name: string; description?: string } | null;
  isActive: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile edit form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password form
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setEditName(data.name);
        setEditEmail(data.email);
      }
    } catch {
      // silent
    } finally {
      setLoadingProfile(false);
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim()) return;

    setSavingProfile(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), email: editEmail.trim() }),
      });

      if (res.ok) {
        showMessage('success', 'Perfil atualizado com sucesso!');
        await fetchProfile();
      } else {
        showMessage('error', 'Erro ao atualizar perfil');
      }
    } catch {
      showMessage('error', 'Erro ao atualizar perfil');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!newPassword.trim()) return;

    if (newPassword !== confirmPassword) {
      showMessage('error', 'As senhas nao coincidem');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('error', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch('/api/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        showMessage('success', 'Senha alterada com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage('error', 'Erro ao alterar senha');
      }
    } catch {
      showMessage('error', 'Erro ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie suas informacoes pessoais e senha</p>
      </div>

      {/* Toast */}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile info card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Informacoes Pessoais</h2>
              <p className="text-sm text-muted-foreground">Atualize seu nome e email</p>
            </div>
          </div>

          {profile?.role && (
            <div className="mb-6 rounded-xl bg-secondary/50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</p>
              <p className="mt-1 text-sm font-medium text-foreground">
                {profile.role.name}
                {profile.role.description && (
                  <span className="text-muted-foreground"> - {profile.role.description}</span>
                )}
              </p>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile || !editName.trim() || !editEmail.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar Perfil
              </button>
            </div>
          </form>
        </div>

        {/* Password card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50">
              <Key className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Alterar Senha</h2>
              <p className="text-sm text-muted-foreground">Defina uma nova senha para sua conta</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPassword || !newPassword.trim() || !confirmPassword.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-50"
              >
                {savingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                Alterar Senha
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
