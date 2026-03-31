import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { TranscriptionPort } from '../../../domain/ports/outbound/transcription.port';
import { TranscriptionResult } from '../../../domain/entities/transcription.entity';

@Injectable()
export class OpenRouterTranscriptionAdapter implements TranscriptionPort {
  private readonly logger = new Logger(OpenRouterTranscriptionAdapter.name);
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  async transcribe(
    audioBuffer: Buffer,
    mimetype: string,
    language?: string,
    withTimestamps?: boolean,
    apiKey?: string,
  ): Promise<TranscriptionResult> {
    if (!apiKey) throw new Error('OpenRouter API key não configurada');

    const startTime = Date.now();
    const model = 'openai/whisper-1';

    const form = new FormData();
    form.append('file', audioBuffer, {
      filename: `audio.${mimetype.includes('mp3') ? 'mp3' : 'ogg'}`,
      contentType: mimetype,
    });
    form.append('model', model);
    if (language) form.append('language', language);
    form.append('response_format', withTimestamps ? 'verbose_json' : 'json');

    const response = await axios.post(`${this.baseUrl}/audio/transcriptions`, form, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        ...form.getHeaders(),
      },
      timeout: 120000,
      maxContentLength: Infinity,
    });

    const data = response.data;
    const processingMs = Date.now() - startTime;

    return {
      text: data.text || '',
      language: data.language || language,
      duration: data.duration,
      segments: withTimestamps && data.segments
        ? data.segments.map((s: any) => ({ start: s.start, end: s.end, text: s.text }))
        : undefined,
      provider: 'openrouter',
      model,
      processingMs,
    };
  }
}
