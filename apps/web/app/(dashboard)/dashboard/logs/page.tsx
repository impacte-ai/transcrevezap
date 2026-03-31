import { ScrollText } from 'lucide-react';

export default function LogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Logs</h1>
        <p className="text-sm text-muted-foreground">Visualize logs de processamento</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
        <ScrollText className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">Logs de transcrição</p>
        <p className="mt-1 text-sm text-muted-foreground">Tabela paginada com filtros</p>
      </div>
    </div>
  );
}
