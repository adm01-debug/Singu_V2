import { Keyboard } from 'lucide-react';
import { KeyboardHint } from '@/components/ui/keyboard-hint';
import { cn } from '@/lib/utils';

interface KeyboardListHintProps {
  className?: string;
  /** Mostrar atalho de seleção (x). */
  showSelect?: boolean;
}

/**
 * Hint discreto fixo no rodapé de listas com os atalhos de teclado
 * suportados por `useListNavigation`. Hidden em mobile (touch).
 */
export function KeyboardListHint({ className, showSelect = true }: KeyboardListHintProps) {
  return (
    <div
      className={cn(
        'hidden md:flex items-center justify-end gap-3 px-4 py-2 text-[10px] text-muted-foreground border-t border-border/40 bg-muted/30',
        className,
      )}
      role="note"
      aria-label="Atalhos de teclado disponíveis"
    >
      <span className="flex items-center gap-1.5">
        <Keyboard className="h-3 w-3" />
        Atalhos:
      </span>
      <span className="flex items-center gap-1">
        <KeyboardHint keys={['j']} />
        <KeyboardHint keys={['k']} />
        <span>navegar</span>
      </span>
      <span className="flex items-center gap-1">
        <KeyboardHint keys={['Enter']} />
        <span>abrir</span>
      </span>
      {showSelect && (
        <span className="flex items-center gap-1">
          <KeyboardHint keys={['x']} />
          <span>selecionar</span>
        </span>
      )}
      <span className="flex items-center gap-1">
        <KeyboardHint keys={['?']} />
        <span>ajuda</span>
      </span>
    </div>
  );
}
