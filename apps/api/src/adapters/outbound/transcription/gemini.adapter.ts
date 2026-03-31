import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { TranscriptionPort } from '../../../domain/ports/outbound/transcription.port';
import { TranscriptionResult } from '../../../domain/entities/transcription.entity';

@Injectable()
export class GeminiTranscriptionAdapter implements TranscriptionPort {
  private readonly logger = new Logger(GeminiTranscriptionAdapter.name);

  async transcribe(
    audioBuffer: Buffer,
    mimetype: string,
    language?: string,
    withTimestamps?: boolean,
    apiKey?: string,
  ): Promise<TranscriptionResult> {
    if (!apiKey) throw new Error('Google Gemini API key não configurada');

    const startTime = Date.now();
    const model = 'gemini-2.5-flash';

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    const base64Audio = audioBuffer.toString('base64');

    const prompt = language
      ? `Transcreva o seguinte áudio em ${language}. Retorne APENAS o texto transcrito, sem explicações.${withTimestamps ? ' Inclua timestamps no formato [MM:SS] no início de cada trecho.' : ''}`
      : `Transcreva o seguinte áudio. Detecte o idioma automaticamente. Retorne APENAS o texto transcrito, sem explicações.${withTimestamps ? ' Inclua timestamps no formato [MM:SS] no início de cada trecho.' : ''}`;

    const result = await geminiModel.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType: mimetype,
          data: base64Audio,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();
    const processingMs = Date.now() - startTime;

    if (!text) throw new Error('Gemini: resposta vazia');

    return {
      text,
      language: language || 'auto',
      provider: 'gemini',
      model,
      processingMs,
    };
  }
}
