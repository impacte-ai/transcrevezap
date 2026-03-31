import type { Metadata } from 'next';
import { ThemeProvider } from '@/lib/theme';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TranscreveZAP',
    template: '%s | TranscreveZAP',
  },
  description: 'Plataforma inteligente de transcrição e sumarização de áudios do WhatsApp com IA. Multi-provedor: Evolution API, UAZAPI, ZPRO. Multi-IA: Groq, OpenAI, Gemini, Deepgram, OpenRouter.',
  keywords: ['whatsapp', 'transcrição', 'áudio', 'ia', 'whisper', 'groq', 'evolution api', 'transcrevezap'],
  authors: [{ name: 'Impacte AI', url: 'https://impacte.ai' }],
  creator: 'Impacte AI',
  publisher: 'Impacte AI',
  openGraph: {
    title: 'TranscreveZAP',
    description: 'Transcrição inteligente de áudios do WhatsApp com IA',
    url: 'https://github.com/impacte/transcrevezap',
    siteName: 'TranscreveZAP',
    locale: 'pt_BR',
    type: 'website',
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
