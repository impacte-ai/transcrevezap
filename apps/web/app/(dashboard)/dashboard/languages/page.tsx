import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function LanguagesPage() {
  let config = { autoDetection: 'true', autoTranslation: 'false', defaultLanguage: 'pt' };
  try {
    config = await api('/languages');
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Idiomas</h1>
        <p className="text-sm text-muted-foreground">Configure detecção e tradução automática</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Idioma Padrão</p>
          <p className="mt-1 text-xl font-bold text-foreground">{config.defaultLanguage?.toUpperCase()}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Auto-Detecção</p>
          <p className="mt-1 text-xl font-bold text-foreground">{config.autoDetection === 'true' ? 'Ativo' : 'Inativo'}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Auto-Tradução</p>
          <p className="mt-1 text-xl font-bold text-foreground">{config.autoTranslation === 'true' ? 'Ativo' : 'Inativo'}</p>
        </div>
      </div>
    </div>
  );
}
