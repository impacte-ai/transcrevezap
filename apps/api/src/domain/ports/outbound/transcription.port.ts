import { TranscriptionResult } from '../../entities/transcription.entity';

export interface TranscriptionPort {
  transcribe(
    audioBuffer: Buffer,
    mimetype: string,
    language?: string,
    withTimestamps?: boolean,
  ): Promise<TranscriptionResult>;
}

export const TRANSCRIPTION_PORT = Symbol('TranscriptionPort');
