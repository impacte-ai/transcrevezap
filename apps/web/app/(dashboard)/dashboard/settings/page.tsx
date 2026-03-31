import { api } from '@/lib/api';
import { SettingsForm } from './settings-form';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let settings: Record<string, string> = {};
  try {
    settings = await api('/settings');
  } catch {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure o comportamento do TranscreveZAP</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}
