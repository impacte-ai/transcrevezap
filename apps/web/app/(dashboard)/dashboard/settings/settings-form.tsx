'use client';

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

type FieldKind = 'select' | 'text' | 'number' | 'toggle' | 'textarea' | 'apikey';

interface Option {
  label: string;
  value: string;
}

interface FieldDef {
  key: string;
  label: string;
  kind: FieldKind;
  options?: Option[];
  placeholder?: string;
  description?: string;
}

interface SectionDef {
  id: string;
  title: string;
  fields: FieldDef[];
}

// ---------------------------------------------------------------------------
// Constant definitions
// ---------------------------------------------------------------------------

const STT_PROVIDERS: Option[] = [
  { label: 'Groq', value: 'groq' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Deepgram', value: 'deepgram' },
  { label: 'Google Gemini', value: 'gemini' },
  { label: 'OpenRouter', value: 'openrouter' },
];

const STT_PROVIDERS_WITH_NONE: Option[] = [
  { label: 'Nenhum', value: '' },
  ...STT_PROVIDERS,
];

const LLM_PROVIDERS: Option[] = [
  { label: 'Groq', value: 'groq' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Google Gemini', value: 'gemini' },
  { label: 'OpenRouter', value: 'openrouter' },
];

const OUTPUT_MODES: Option[] = [
  { label: 'Ambos', value: 'both' },
  { label: 'Apenas Resumo', value: 'summary_only' },
  { label: 'Apenas Transcrição', value: 'transcription_only' },
  { label: 'Inteligente', value: 'smart' },
];

const LANGUAGES: Option[] = [
  { label: 'Português', value: 'pt' },
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: 'Français', value: 'fr' },
  { label: 'Deutsch', value: 'de' },
  { label: 'Italiano', value: 'it' },
  { label: '日本語', value: 'ja' },
  { label: '한국어', value: 'ko' },
  { label: '中文', value: 'zh' },
  { label: 'Русский', value: 'ru' },
  { label: 'العربية', value: 'ar' },
  { label: 'हिन्दी', value: 'hi' },
  { label: 'Nederlands', value: 'nl' },
  { label: 'Polski', value: 'pl' },
  { label: 'Türkçe', value: 'tr' },
  { label: 'Română', value: 'ro' },
];

const PROCESSING_MODES: Option[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Apenas Grupos', value: 'groups_only' },
];

const API_KEY_PROVIDERS = ['groq', 'openai', 'deepgram', 'gemini', 'openrouter'] as const;

const SECTIONS: SectionDef[] = [
  {
    id: 'transcription',
    title: 'Transcrição (STT)',
    fields: [
      { key: 'transcription.sttProvider', label: 'Provedor STT', kind: 'select', options: STT_PROVIDERS },
      { key: 'transcription.sttModel', label: 'Modelo STT', kind: 'text', placeholder: 'ex: whisper-large-v3-turbo' },
      { key: 'transcription.language', label: 'Idioma Padrão', kind: 'select', options: LANGUAGES },
      { key: 'transcription.useTimestamps', label: 'Timestamps', kind: 'toggle', description: 'Incluir marcas de tempo na transcrição' },
      { key: 'transcription.sttFallbackProvider', label: 'Provedor STT Fallback', kind: 'select', options: STT_PROVIDERS_WITH_NONE },
      { key: 'transcription.sttFallbackModel', label: 'Modelo STT Fallback', kind: 'text', placeholder: 'ex: whisper-1' },
    ],
  },
  {
    id: 'summarization',
    title: 'Sumarização (LLM)',
    fields: [
      { key: 'transcription.llmProvider', label: 'Provedor LLM', kind: 'select', options: LLM_PROVIDERS },
      { key: 'transcription.llmModel', label: 'Modelo LLM', kind: 'text', placeholder: 'ex: llama-3.1-70b-versatile' },
      { key: 'transcription.outputMode', label: 'Modo de Saída', kind: 'select', options: OUTPUT_MODES },
      { key: 'transcription.characterLimit', label: 'Limite de Caracteres', kind: 'number', placeholder: '500', description: 'Usado no modo Inteligente' },
    ],
  },
  {
    id: 'messaging',
    title: 'Mensagens',
    fields: [
      { key: 'messaging.summaryHeader', label: 'Header do Resumo', kind: 'text', placeholder: 'ex: Resumo do áudio:' },
      { key: 'messaging.transcriptionHeader', label: 'Header da Transcrição', kind: 'text', placeholder: 'ex: Transcrição:' },
      { key: 'messaging.businessMessage', label: 'Mensagem de Negócio', kind: 'textarea', placeholder: 'Mensagem adicionada ao final das respostas', description: 'Texto anexado ao final de cada resposta enviada' },
    ],
  },
  {
    id: 'processing',
    title: 'Processamento',
    fields: [
      { key: 'processing.mode', label: 'Modo de Processamento', kind: 'select', options: PROCESSING_MODES },
      { key: 'processing.selfMessages', label: 'Processar Próprias Mensagens', kind: 'toggle', description: 'Transcrever mensagens enviadas por você' },
    ],
  },
  {
    id: 'languages',
    title: 'Idiomas',
    fields: [
      { key: 'language.autoDetect', label: 'Detecção Automática', kind: 'toggle', description: 'Detectar idioma do áudio automaticamente' },
      { key: 'language.autoTranslate', label: 'Tradução Automática', kind: 'toggle', description: 'Traduzir transcrição para o idioma padrão' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskApiKey(value: string): string {
  if (!value || value.length <= 10) return value ? '••••••••' : '';
  return value.slice(0, 6) + '••••••••' + value.slice(-4);
}

function isTrue(val: string | undefined): boolean {
  return val === 'true' || val === '1' || val === 'yes';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${checked ? 'bg-primary' : 'bg-muted'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function SaveFeedback({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  if (status === 'saving') return <span className="text-sm text-muted-foreground">Salvando...</span>;
  if (status === 'saved') return <span className="text-sm text-green-600 font-medium">Salvo!</span>;
  return <span className="text-sm text-red-600 font-medium">Erro ao salvar</span>;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState<Record<string, string>>({ ...initialSettings });
  const [sectionStatus, setSectionStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const [apiKeyEditing, setApiKeyEditing] = useState<Record<string, boolean>>({});
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});

  const updateLocal = useCallback((key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveSetting = useCallback(async (key: string, value: string) => {
    const res = await fetch('/api/settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) throw new Error('save failed');
  }, []);

  const saveSection = useCallback(async (section: SectionDef) => {
    setSectionStatus((prev) => ({ ...prev, [section.id]: 'saving' }));
    try {
      await Promise.all(
        section.fields.map((f) => saveSetting(f.key, settings[f.key] ?? ''))
      );
      setSectionStatus((prev) => ({ ...prev, [section.id]: 'saved' }));
      setTimeout(() => setSectionStatus((prev) => ({ ...prev, [section.id]: 'idle' })), 2500);
    } catch {
      setSectionStatus((prev) => ({ ...prev, [section.id]: 'error' }));
      setTimeout(() => setSectionStatus((prev) => ({ ...prev, [section.id]: 'idle' })), 3000);
    }
  }, [settings, saveSetting]);

  const saveApiKey = useCallback(async (provider: string) => {
    const key = `apikeys.${provider}`;
    const value = apiKeyValues[provider] ?? '';
    setSectionStatus((prev) => ({ ...prev, apikeys: 'saving' }));
    try {
      await saveSetting(key, value);
      setSettings((prev) => ({ ...prev, [key]: value }));
      setApiKeyEditing((prev) => ({ ...prev, [provider]: false }));
      setApiKeyValues((prev) => ({ ...prev, [provider]: '' }));
      setSectionStatus((prev) => ({ ...prev, apikeys: 'saved' }));
      setTimeout(() => setSectionStatus((prev) => ({ ...prev, apikeys: 'idle' })), 2500);
    } catch {
      setSectionStatus((prev) => ({ ...prev, apikeys: 'error' }));
      setTimeout(() => setSectionStatus((prev) => ({ ...prev, apikeys: 'idle' })), 3000);
    }
  }, [apiKeyValues, saveSetting]);

  const removeApiKey = useCallback(async (provider: string) => {
    const key = `apikeys.${provider}`;
    setSectionStatus((prev) => ({ ...prev, apikeys: 'saving' }));
    try {
      await saveSetting(key, '');
      setSettings((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setApiKeyEditing((prev) => ({ ...prev, [provider]: false }));
      setSectionStatus((prev) => ({ ...prev, apikeys: 'saved' }));
      setTimeout(() => setSectionStatus((prev) => ({ ...prev, apikeys: 'idle' })), 2500);
    } catch {
      setSectionStatus((prev) => ({ ...prev, apikeys: 'error' }));
      setTimeout(() => setSectionStatus((prev) => ({ ...prev, apikeys: 'idle' })), 3000);
    }
  }, [saveSetting]);

  // -------------------------------------------------------------------------
  // Render field
  // -------------------------------------------------------------------------

  function renderField(field: FieldDef) {
    const value = settings[field.key] ?? '';

    switch (field.kind) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => updateLocal(field.key, e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {!value && <option value="">Selecione...</option>}
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateLocal(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateLocal(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => updateLocal(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        );

      case 'toggle':
        return (
          <div className="flex items-center gap-3">
            <Toggle
              checked={isTrue(value)}
              onChange={(v) => updateLocal(field.key, v ? 'true' : 'false')}
            />
            <span className="text-sm text-muted-foreground">
              {isTrue(value) ? 'Ativado' : 'Desativado'}
            </span>
          </div>
        );

      default:
        return null;
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const providerLabels: Record<string, string> = {
    groq: 'Groq',
    openai: 'OpenAI',
    deepgram: 'Deepgram',
    gemini: 'Google Gemini',
    openrouter: 'OpenRouter',
  };

  return (
    <div className="space-y-6">
      {/* Sections */}
      {SECTIONS.map((section) => (
        <div key={section.id} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-display font-semibold text-foreground">{section.title}</h2>
          </div>
          <div className="px-5 py-4 space-y-5">
            {section.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {field.label}
                </label>
                {field.description && (
                  <p className="text-xs text-muted-foreground mb-1.5">{field.description}</p>
                )}
                {renderField(field)}
              </div>
            ))}
          </div>
          <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-3">
            <SaveFeedback status={sectionStatus[section.id] || 'idle'} />
            <button
              type="button"
              onClick={() => saveSection(section)}
              disabled={sectionStatus[section.id] === 'saving'}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sectionStatus[section.id] === 'saving' ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      ))}

      {/* API Keys section */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 flex items-center justify-between">
          <h2 className="font-display font-semibold text-foreground">API Keys</h2>
          <SaveFeedback status={sectionStatus['apikeys'] || 'idle'} />
        </div>
        <div className="divide-y divide-border">
          {API_KEY_PROVIDERS.map((provider) => {
            const storedValue = settings[`apikeys.${provider}`] ?? '';
            const hasKey = !!storedValue;
            const isEditing = apiKeyEditing[provider] ?? false;

            return (
              <div key={provider} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    {providerLabels[provider]}
                  </label>
                  <div className="flex items-center gap-2">
                    {hasKey && !isEditing && (
                      <>
                        <span className="font-mono text-xs text-muted-foreground">
                          {maskApiKey(storedValue)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setApiKeyEditing((prev) => ({ ...prev, [provider]: true }));
                            setApiKeyValues((prev) => ({ ...prev, [provider]: '' }));
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Alterar
                        </button>
                        <button
                          type="button"
                          onClick={() => removeApiKey(provider)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      </>
                    )}
                    {!hasKey && !isEditing && (
                      <button
                        type="button"
                        onClick={() => setApiKeyEditing((prev) => ({ ...prev, [provider]: true }))}
                        className="text-xs text-primary hover:underline"
                      >
                        Adicionar
                      </button>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      value={apiKeyValues[provider] ?? ''}
                      onChange={(e) =>
                        setApiKeyValues((prev) => ({ ...prev, [provider]: e.target.value }))
                      }
                      placeholder="Cole sua API key aqui"
                      className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      type="button"
                      onClick={() => saveApiKey(provider)}
                      disabled={!apiKeyValues[provider]}
                      className="rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setApiKeyEditing((prev) => ({ ...prev, [provider]: false }));
                        setApiKeyValues((prev) => ({ ...prev, [provider]: '' }));
                      }}
                      className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
