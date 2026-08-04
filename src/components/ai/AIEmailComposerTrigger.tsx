import { useEffect } from 'react';
import { Sparkles, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEmailComposerStore } from '@/store/emailComposerStore';

interface Props {
  className?: string;
  variant?: 'icon' | 'pill';
  prefilledContactId?: string | null;
  label?: string;
}

export function AIEmailComposerTrigger({ className, variant = 'icon', prefilledContactId, label }: Props) {
  const open = useEmailComposerStore((s) => s.open);

  // Atalho global ⌘+Shift+E (exceção justificada: side-effect de UI global, não fetch)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        open(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (variant === 'pill') {
    return (
      <Button
        size="sm"
        variant="outline"
        className={className}
        onClick={() => open(prefilledContactId ?? null)}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        {label ?? 'Compor email com IA'}
      </Button>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => open(prefilledContactId ?? null)}
            className={
              className ??
              'shrink-0 h-9 w-9 rounded-full border border-border/40 bg-secondary/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 hover:border-primary/30 transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none relative'
            }
            aria-label="Compor email com IA"
          >
            <Mail className="h-4 w-4" />
            <Sparkles className="h-2.5 w-2.5 absolute -top-0.5 -right-0.5 text-primary" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          Compor email com IA <kbd className="ml-2 px-1 py-0.5 rounded bg-muted text-[10px]">⌘⇧E</kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
