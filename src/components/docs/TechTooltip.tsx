import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface TechTooltipProps {
  content: string;
  title?: string;
  className?: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Tooltip técnico inline para explicar features complexas.
 * Exibe ícone "?" discreto que mostra explicação ao hover.
 *
 * @example
 * <TechTooltip
 *   title="Score de Relacionamento"
 *   content="Calculado com base na frequência de interações, sentimento e tempo desde último contato."
 * />
 */
export function TechTooltip({ content, title, className, side = 'top' }: TechTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center justify-center rounded-full',
            'text-muted-foreground/70 hover:text-muted-foreground transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'w-4 h-4',
            className
          )}
          aria-label={title ? `Ajuda: ${title}` : 'Ajuda'}
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-72 text-xs">
        {title && <p className="font-semibold mb-1">{title}</p>}
        <p className="text-muted-foreground leading-relaxed">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
}
