import { cn } from '@/lib/utils';

const providerColors: Record<string, string> = {
  evolution: 'bg-green-500/10 text-green-400 border-green-500/20',
  uazapi: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  zpro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export function ProviderBadge({ provider }: { provider: string }) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      providerColors[provider] || 'bg-secondary text-secondary-foreground border-border',
    )}>
      {provider.toUpperCase()}
    </span>
  );
}
