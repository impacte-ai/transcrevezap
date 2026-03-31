import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  accent?: boolean;
}

export function StatsCard({ title, value, icon: Icon, description, accent }: StatsCardProps) {
  return (
    <div className={cn(
      'rounded-2xl p-6 transition-shadow hover:shadow-md',
      accent
        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
        : 'border border-border bg-card',
    )}>
      <div className="flex items-center justify-between">
        <p className={cn('text-sm font-medium', accent ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
          {title}
        </p>
        <div className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          accent ? 'bg-white/20' : 'bg-secondary',
        )}>
          <Icon className={cn('h-[18px] w-[18px]', accent ? 'text-primary-foreground' : 'text-muted-foreground')} />
        </div>
      </div>
      <p className={cn('mt-3 font-display text-4xl font-bold', accent ? 'text-primary-foreground' : 'text-foreground')}>
        {value}
      </p>
      {description && (
        <p className={cn('mt-1 text-xs', accent ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </div>
  );
}
