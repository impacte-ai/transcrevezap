export type OutputMode = 'summary_only' | 'transcription_only' | 'both' | 'smart';
export type TranscriptionStatus = 'processing' | 'completed' | 'failed';

export interface TranscriptionEntity {
  id?: string;
  connectionId: string;
  remoteJid: string;
  messageId: string;
  isGroup: boolean;
  originalText: string;
  summary?: string;
  language?: string;
  duration?: number;
  provider: string;
  model: string;
  processingMs?: number;
  outputMode: OutputMode;
  status: TranscriptionStatus;
  error?: string;
  createdAt?: Date;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  segments?: TranscriptionSegment[];
  provider: string;
  model: string;
  processingMs: number;
}

export interface SummarizationResult {
  summary: string;
  provider: string;
  model: string;
  processingMs: number;
}
