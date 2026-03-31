import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  let settings: Record<string, string> = {};
  try {
    settings = await api('/settings');
  } catch {}

  const sections = [
    { title: 'Transcrição', keys: ['transcription.sttProvider', 'transcription.sttModel', 'transcription.language', 'transcription.useTimestamps'] },
    { title: 'Sumarização', keys: ['transcription.llmProvider', 'transcription.llmModel', 'transcription.outputMode', 'transcription.characterLimit'] },
    { title: 'Mensagens', keys: ['messaging.summaryHeader', 'messaging.transcriptionHeader', 'messaging.businessMessage'] },
    { title: 'Processamento', keys: ['processing.mode', 'processing.selfMessages'] },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure o comportamento do TranscreveZAP</p>
      </div>
      {sections.map((section) => (
        <div key={section.title} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display font-semibold text-foreground">{section.title}</h2>
          </div>
          <div className="divide-y divide-border">
            {section.keys.map((key) => (
              <div key={key} className="flex items-center justify-between px-5 py-3">
                <span className="text-sm text-muted-foreground">{key}</span>
                <span className="font-mono text-sm text-foreground">{settings[key] || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
