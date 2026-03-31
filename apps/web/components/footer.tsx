export function Footer() {
  const version = process.env.npm_package_version || '3.0.0';
  return (
    <footer className="border-t border-border px-6 py-3 text-center text-xs text-muted-foreground">
      <span>Powered by </span>
      <a href="https://impacte.ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
        Impacte AI
      </a>
      <span> — impacte.ai</span>
      <span className="ml-4">v{version}</span>
    </footer>
  );
}
