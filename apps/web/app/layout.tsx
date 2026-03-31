import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TranscreveZAP',
  description: 'Transcrição inteligente de áudios do WhatsApp',
  icons: { icon: '/static/fluxo.png' },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
