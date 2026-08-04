import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CodeExampleProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

/**
 * Bloco de código com syntax highlighting básico e botão de cópia.
 * Usado na documentação inline e na página /docs.
 */
export function CodeExample({ code, language = 'typescript', title, className }: CodeExampleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn('rounded-lg border bg-muted/30 overflow-hidden', className)}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <span className="text-[10px] text-muted-foreground/70 uppercase">{language}</span>
        </div>
      )}
      <div className="relative group">
        <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed">
          <code>{code}</code>
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute top-2 right-2 h-7 w-7',
            'opacity-0 group-hover:opacity-100 transition-opacity'
          )}
          onClick={handleCopy}
          aria-label="Copiar código"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
