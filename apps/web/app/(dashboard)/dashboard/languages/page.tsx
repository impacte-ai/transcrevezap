import { api } from '@/lib/api';
import { LanguagesClient } from './languages-client';

export const dynamic = 'force-dynamic';

export default async function LanguagesPage() {
  let config = { autoDetection: 'true', autoTranslation: 'false', defaultLanguage: 'pt' };
  try {
    config = await api('/languages');
  } catch {}

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Idiomas</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure deteccao e traducao automatica</p>
      </div>
      <LanguagesClient initialConfig={config} />
    </div>
  );
}
