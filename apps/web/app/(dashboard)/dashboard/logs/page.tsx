import { ScrollText } from 'lucide-react';

export default function LogsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visualize logs de processamento</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
        <ScrollText className="h-12 w-12 text-muted-foreground/40" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">Logs de transcrição</p>
        <p className="mt-1 text-sm text-muted-foreground/70">Tabela paginada com filtros</p>
      </div>
    </div>
  );
}
