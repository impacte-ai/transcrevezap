import { SummarizationResult } from '../../entities/transcription.entity';

export interface SummarizationPort {
  summarize(
    text: string,
    language: string,
    apiKey?: string,
    model?: string,
  ): Promise<SummarizationResult>;
}

export const SUMMARIZATION_PORT = Symbol('SummarizationPort');
