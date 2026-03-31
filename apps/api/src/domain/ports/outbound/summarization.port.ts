import { SummarizationResult } from '../../entities/transcription.entity';

export interface SummarizationPort {
  summarize(
    text: string,
    language: string,
  ): Promise<SummarizationResult>;
}

export const SUMMARIZATION_PORT = Symbol('SummarizationPort');
