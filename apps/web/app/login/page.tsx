'use client';

import { Suspense, useState } from 'react';
import { signIn } from '@/lib/auth-client';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError('Email ou senha incorretos');
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@transcrevezap.local"
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Senha
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 rounded-lg border border-border bg-card p-8">
        <div className="flex flex-col items-center space-y-4">
          <Image
            src="/static/fluxo.png"
            alt="TranscreveZAP"
            width={80}
            height={80}
            className="rounded-lg"
          />
          <h1 className="text-2xl font-bold text-foreground">TranscreveZAP</h1>
          <p className="text-sm text-muted-foreground">
            Transcrição inteligente de áudios do WhatsApp
          </p>
        </div>

        <Suspense fallback={<div className="space-y-4 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <div className="pt-4 text-center text-xs text-muted-foreground">
          <a href="https://impacte.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            Powered by Impacte AI
          </a>
        </div>
      </div>
    </div>
  );
}
