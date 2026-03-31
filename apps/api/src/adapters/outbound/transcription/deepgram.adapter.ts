import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { TranscriptionPort } from '../../../domain/ports/outbound/transcription.port';
import { TranscriptionResult } from '../../../domain/entities/transcription.entity';

@Injectable()
export class DeepgramTranscriptionAdapter implements TranscriptionPort {
  private readonly logger = new Logger(DeepgramTranscriptionAdapter.name);
  private readonly baseUrl = 'https://api.deepgram.com/v1';

  async transcribe(
    audioBuffer: Buffer,
    mimetype: string,
    language?: string,
    withTimestamps?: boolean,
    apiKey?: string,
  ): Promise<TranscriptionResult> {
    if (!apiKey) throw new Error('Deepgram API key não configurada');

    const startTime = Date.now();
    const model = 'nova-3';

    const params = new URLSearchParams({
      model,
      smart_format: 'true',
      ...(language ? { language } : { detect_language: 'true' }),
      ...(withTimestamps ? { utterances: 'true' } : {}),
    });

    const response = await axios.post(
      `${this.baseUrl}/listen?${params.toString()}`,
      audioBuffer,
      {
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': mimetype,
        },
        timeout: 120000,
        maxContentLength: Infinity,
      },
    );

    const result = response.data?.results?.channels?.[0]?.alternatives?.[0];
    const processingMs = Date.now() - startTime;

    if (!result) throw new Error('Deepgram: resposta vazia');

    return {
      text: result.transcript || '',
      language: response.data?.results?.channels?.[0]?.detected_language || language,
      duration: response.data?.metadata?.duration,
      segments: withTimestamps && result.words
        ? this.wordsToSegments(result.words)
        : undefined,
      provider: 'deepgram',
      model,
      processingMs,
    };
  }

  private wordsToSegments(words: any[]): Array<{ start: number; end: number; text: string }> {
    if (!words.length) return [];
    const segments: Array<{ start: number; end: number; text: string }> = [];
    let current = { start: words[0].start, end: words[0].end, text: words[0].word };

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      // Group words into ~10 second segments
      if (word.start - current.start > 10) {
        segments.push(current);
        current = { start: word.start, end: word.end, text: word.word };
      } else {
        current.end = word.end;
        current.text += ` ${word.word}`;
      }
    }
    segments.push(current);
    return segments;
  }
}
