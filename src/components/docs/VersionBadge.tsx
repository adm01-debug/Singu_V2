import { Badge } from '@/components/ui/badge';

const APP_VERSION = '2.8.0';

/**
 * Badge de versão do app para exibição no footer ou settings.
 * Exibe versão semântica e link para changelog interno.
 */
export function VersionBadge() {
  return (
    <div className="flex items-center gap-2 text-[10px] text-muted-foreground/70">
      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono">
        v{APP_VERSION}
      </Badge>
      <span>SINGU CRM</span>
    </div>
  );
}

export { APP_VERSION };
