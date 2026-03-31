import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SummarizationPort } from '../../../domain/ports/outbound/summarization.port';
import { SummarizationResult } from '../../../domain/entities/transcription.entity';

const SUMMARIZATION_PROMPTS: Record<string, string> = {
  pt: 'Resuma o seguinte texto de forma concisa e clara, mantendo os pontos principais:',
  en: 'Summarize the following text concisely and clearly, keeping the main points:',
  es: 'Resume el siguiente texto de forma concisa y clara, manteniendo los puntos principales:',
};

@Injectable()
export class GeminiChatAdapter implements SummarizationPort {
  private readonly logger = new Logger(GeminiChatAdapter.name);

  async summarize(
    text: string,
    language: string,
    apiKey?: string,
    model?: string,
  ): Promise<SummarizationResult> {
    if (!apiKey) throw new Error('Google Gemini API key não configurada');

    const startTime = Date.now();
    const useModel = model || 'gemini-2.5-flash';

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model: useModel });

    const prompt = SUMMARIZATION_PROMPTS[language] || SUMMARIZATION_PROMPTS.pt;

    const result = await geminiModel.generateContent(`${prompt}\n\n${text}`);
    const summary = result.response.text();

    if (!summary || summary.length < 10) throw new Error('Gemini: resumo vazio');

    return {
      summary,
      provider: 'gemini',
      model: useModel,
      processingMs: Date.now() - startTime,
    };
  }
}
