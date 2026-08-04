import { Clock, Sparkles, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Ficha360Sort } from '@/hooks/useFicha360Sort';

interface Props {
  sort: Ficha360Sort;
  onChange: (next: Ficha360Sort) => void;
  hasQuery: boolean;
}

/**
 * Toggle segmentado para ordenar "Últimas Interações" entre "Recente" e
 * "Relevante". "Relevante" só fica habilitado quando há busca textual ativa
 * (caso contrário não há termo para pontuar).
 */
export function OrdenacaoToggle({ sort, onChange, hasQuery }: Props) {
  const relevanteDisabled = !hasQuery;

  const handleRelevante = () => {
    if (relevanteDisabled) return;
    onChange('relevante');
  };

  return (
    <TooltipProvider delayDuration={250}>
      <div
        role="radiogroup"
        aria-label="Ordenar por"
        className="inline-flex items-center rounded-md border border-border bg-background p-0.5 text-xs"
      >
        <button
          type="button"
          role="radio"
          aria-checked={sort === 'recente'}
          aria-pressed={sort === 'recente'}
          onClick={() => onChange('recente')}
          className={cn(
            'inline-flex items-center gap-1 rounded px-2 py-1 transition-colors',
            sort === 'recente'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          <Clock className="h-3 w-3" aria-hidden="true" />
          <span>Recente</span>
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              role="radio"
              aria-checked={sort === 'relevante'}
              aria-pressed={sort === 'relevante'}
              aria-disabled={relevanteDisabled}
              onClick={handleRelevante}
              className={cn(
                'inline-flex items-center gap-1 rounded px-2 py-1 transition-colors',
                sort === 'relevante' && !relevanteDisabled
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                relevanteDisabled && 'opacity-50 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground',
              )}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span>Relevante</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {relevanteDisabled
              ? 'Disponível ao buscar por palavra-chave'
              : 'Ordena pelos itens com mais ocorrências do termo buscado'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span
              tabIndex={0}
              aria-label="Como funciona a relevância"
              className="inline-flex items-center justify-center px-1 text-muted-foreground hover:text-foreground cursor-help"
            >
              <Info className="h-3 w-3" aria-hidden="true" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            Pontuação por ocorrências do termo: assunto conta 3×, resumo/canal 1×.
            Empate desempata pela mais recente.
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
