export type OutputMode = 'summary_only' | 'transcription_only' | 'both' | 'smart';

export type TranscriptionStatus = 'processing' | 'completed' | 'failed';

export type AIProviderType = 'groq' | 'openai' | 'gemini' | 'deepgram' | 'openrouter';

export type ProviderModelType = 'stt' | 'llm';

export interface AudioMessage {
  connectionId: string;
  provider: string;
  messageId: string;
  remoteJid: string;
  isGroup: boolean;
  fromMe: boolean;
  mediaUrl?: string;
  base64Data?: string;
  mimetype?: string;
  serverUrl?: string;
  apiKey?: string;
  instanceName?: string;
  providerToken?: string;
  timestamp: Date;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
  provider: AIProviderType;
  model: string;
  processingMs: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface SummarizationResult {
  summary: string;
  provider: AIProviderType;
  model: string;
  processingMs: number;
}
