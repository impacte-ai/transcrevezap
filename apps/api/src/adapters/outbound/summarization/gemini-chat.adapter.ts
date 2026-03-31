import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SummarizationPort } from '../../../domain/ports/outbound/summarization.port';
import { SummarizationResult } from '../../../domain/entities/transcription.entity';

const SUMMARIZATION_PROMPTS: Record<string, string> = {
  pt: 'Resuma o seguinte texto de forma concisa e clara, mantendo os pontos principais:',
  en: 'Summarize the following text concisely and clearly, keeping the main points:',
  es: 'Resume el siguiente texto de forma concisa y clara, manteniendo los puntos principales:',
  fr: 'Résumez le texte suivant de manière concise et claire, en gardant les points principaux:',
  de: 'Fassen Sie den folgenden Text prägnant und klar zusammen, behalten Sie die wichtigsten Punkte bei:',
  it: 'Riassumi il seguente testo in modo conciso e chiaro, mantenendo i punti principali:',
  ja: '以下のテキストを簡潔かつ明確に要約し、主要なポイントを維持してください：',
  ko: '다음 텍스트를 간결하고 명확하게 요약하고 주요 사항을 유지하세요:',
  zh: '简洁明了地总结以下文本，保留要点：',
  ru: 'Кратко и ясно резюмируйте следующий текст, сохранив основные моменты:',
  ar: 'لخص النص التالي بإيجاز ووضوح مع الحفاظ على النقاط الرئيسية:',
  hi: 'निम्नलिखित पाठ को संक्षिप्त और स्पष्ट रूप से सारांशित करें, मुख्य बिंदुओं को बनाए रखें:',
  nl: 'Vat de volgende tekst beknopt en duidelijk samen, met behoud van de belangrijkste punten:',
  pl: 'Podsumuj poniższy tekst zwięźle i jasno, zachowując główne punkty:',
  tr: 'Aşağıdaki metni özlü ve net bir şekilde özetleyin, ana noktaları koruyun:',
  ro: 'Rezumați textul următor în mod concis și clar, păstrând punctele principale:',
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
