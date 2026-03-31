'use client';

import { useState, useEffect, useCallback } from 'react';

interface ContactLanguage {
  contactJid: string;
  language: string;
  autoDetected: boolean;
  confidence?: number | null;
  updatedAt: string;
}

interface LanguageConfig {
  autoDetection: string | null;
  autoTranslation: string | null;
  defaultLanguage: string | null;
}

const LANGUAGES = [
  { label: 'Portugues (Brasil)', value: 'pt' },
  { label: 'Ingles', value: 'en' },
  { label: 'Espanhol', value: 'es' },
  { label: 'Frances', value: 'fr' },
  { label: 'Alemao', value: 'de' },
  { label: 'Italiano', value: 'it' },
  { label: 'Japones', value: 'ja' },
  { label: 'Coreano', value: 'ko' },
  { label: 'Chines', value: 'zh' },
  { label: 'Russo', value: 'ru' },
  { label: 'Arabe', value: 'ar' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Holandes', value: 'nl' },
  { label: 'Polones', value: 'pl' },
  { label: 'Turco', value: 'tr' },
  { label: 'Romeno', value: 'ro' },
];

function getLangLabel(code: string) {
  return LANGUAGES.find((l) => l.value === code)?.label || code.toUpperCase();
}

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

export function LanguagesClient({ initialConfig }: { initialConfig: LanguageConfig }) {
  const [config, setConfig] = useState({
    defaultLanguage: initialConfig.defaultLanguage || 'pt',
    autoDetection: initialConfig.autoDetection === 'true',
    autoTranslation: initialConfig.autoTranslation === 'true',
  });
  const [contacts, setContacts] = useState<ContactLanguage[]>([]);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [savedFeedback, setSavedFeedback] = useState<Record<string, boolean>>({});

  // Add contact form
  const [newJid, setNewJid] = useState('');
  const [newLang, setNewLang] = useState('pt');

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/languages/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const saveSetting = async (key: string, value: string, feedbackKey: string) => {
    setSaving((prev) => ({ ...prev, [feedbackKey]: true }));
    try {
      const res = await fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        setSavedFeedback((prev) => ({ ...prev, [feedbackKey]: true }));
        setTimeout(() => setSavedFeedback((prev) => ({ ...prev, [feedbackKey]: false })), 2500);
      }
    } catch {
      // silent
    } finally {
      setSaving((prev) => ({ ...prev, [feedbackKey]: false }));
    }
  };

  const addContact = async () => {
    if (!newJid.trim()) return;
    try {
      const res = await fetch('/api/languages/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactJid: newJid.trim(), language: newLang }),
      });
      if (res.ok) {
        setNewJid('');
        await loadContacts();
      }
    } catch {
      // silent
    }
  };

  const removeContact = async (jid: string) => {
    try {
      const res = await fetch(`/api/languages/contacts/${encodeURIComponent(jid)}`, { method: 'DELETE' });
      if (res.ok) {
        await loadContacts();
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuracao Geral */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display font-semibold text-foreground">Configuracao Geral</h2>
        </div>
        <div className="px-5 py-4 space-y-5">
          {/* Idioma Padrao */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Idioma Padrao</label>
            <div className="flex items-center gap-3">
              <select
                value={config.defaultLanguage}
                onChange={(e) => setConfig((prev) => ({ ...prev, defaultLanguage: e.target.value }))}
                className="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => saveSetting('transcription.language', config.defaultLanguage, 'defaultLanguage')}
                disabled={saving['defaultLanguage']}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving['defaultLanguage'] ? 'Salvando...' : 'Salvar'}
              </button>
              {savedFeedback['defaultLanguage'] && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
            </div>
          </div>

          {/* Deteccao Automatica */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Deteccao Automatica</label>
            <p className="text-xs text-muted-foreground mb-1.5">Detectar idioma do audio automaticamente</p>
            <div className="flex items-center gap-3">
              <Toggle
                checked={config.autoDetection}
                onChange={(v) => {
                  setConfig((prev) => ({ ...prev, autoDetection: v }));
                  saveSetting('language.autoDetect', v ? 'true' : 'false', 'autoDetection');
                }}
              />
              <span className="text-sm text-muted-foreground">
                {config.autoDetection ? 'Ativado' : 'Desativado'}
              </span>
              {savedFeedback['autoDetection'] && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
            </div>
          </div>

          {/* Traducao Automatica */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Traducao Automatica</label>
            <p className="text-xs text-muted-foreground mb-1.5">Traduzir transcricao para o idioma padrao</p>
            <div className="flex items-center gap-3">
              <Toggle
                checked={config.autoTranslation}
                onChange={(v) => {
                  setConfig((prev) => ({ ...prev, autoTranslation: v }));
                  saveSetting('language.autoTranslate', v ? 'true' : 'false', 'autoTranslation');
                }}
              />
              <span className="text-sm text-muted-foreground">
                {config.autoTranslation ? 'Ativado' : 'Desativado'}
              </span>
              {savedFeedback['autoTranslation'] && <span className="text-sm text-green-600 font-medium">Salvo!</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Idiomas por Contato */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display font-semibold text-foreground">Idiomas por Contato</h2>
        </div>
        <div className="px-5 py-4 space-y-4">
          {/* Add form */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1.5">JID do Contato</label>
              <input
                type="text"
                value={newJid}
                onChange={(e) => setNewJid(e.target.value)}
                placeholder="ex: 5511999999999@s.whatsapp.net"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium text-foreground mb-1.5">Idioma</label>
              <select
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={addContact}
              disabled={!newJid.trim()}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Adicionar
            </button>
          </div>

          {/* Table */}
          {contacts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Contato (JID)</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Idioma</th>
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Auto-detectado</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.contactJid} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 font-mono text-xs text-foreground">{c.contactJid}</td>
                      <td className="py-3 px-2 text-foreground">{getLangLabel(c.language)}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {c.autoDetected ? (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Sim{c.confidence != null ? ` (${(c.confidence * 100).toFixed(0)}%)` : ''}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Nao</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeContact(c.contactJid)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Nenhum idioma configurado por contato.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
