import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { color: string; icon: typeof Wifi; label: string }> = {
  connected: { color: 'text-green-400', icon: Wifi, label: 'Conectado' },
  disconnected: { color: 'text-red-400', icon: WifiOff, label: 'Desconectado' },
  qr_code: { color: 'text-yellow-400', icon: Loader2, label: 'Aguardando QR' },
  connecting: { color: 'text-yellow-400', icon: Loader2, label: 'Conectando' },
};

export function ConnectionStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.disconnected;
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-1.5', config.color)}>
      <Icon className={cn('h-4 w-4', status === 'connecting' || status === 'qr_code' ? 'animate-spin' : '')} />
      <span className="text-sm">{config.label}</span>
    </div>
  );
}
