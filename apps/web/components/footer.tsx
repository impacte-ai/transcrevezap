export function Footer() {
  return (
    <footer className="border-t border-border bg-card px-6 py-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Powered by{' '}
          <a href="https://impacte.ai" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            Impacte AI
          </a>
          {' '}— impacte.ai
        </span>
        <span className="font-mono text-[10px]">v3.0.0</span>
      </div>
    </footer>
  );
}
