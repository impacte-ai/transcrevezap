import { cn } from '@/lib/utils';

const providerColors: Record<string, string> = {
  evolution: 'bg-green-50 text-green-700 border-green-200',
  uazapi: 'bg-blue-50 text-blue-700 border-blue-200',
  zpro: 'bg-purple-50 text-purple-700 border-purple-200',
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
