import type { Metadata } from 'next';

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
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
