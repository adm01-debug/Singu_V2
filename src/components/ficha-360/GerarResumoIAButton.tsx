import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Props {
  count: number;
  onClick: () => void;
  hasRecentCache?: boolean;
}

export function GerarResumoIAButton({ count, onClick, hasRecentCache }: Props) {
  const disabled = count === 0;

  const button = (
    <Button
      size="sm"
      variant="gradient"
      onClick={onClick}
      disabled={disabled}
      className="h-8 gap-1.5"
      aria-label={`Gerar resumo IA das ${count} interações filtradas`}
    >
      <Sparkles className="h-3.5 w-3.5" />
      Resumo IA
      <Badge
        variant="secondary"
        className="h-4 px-1.5 text-[10px] bg-background/30 text-primary-foreground border-0"
      >
        {count}
      </Badge>
      {hasRecentCache && !disabled && (
        <RefreshCw className="h-3 w-3 opacity-70" aria-hidden="true" />
      )}
    </Button>
  );

  if (!disabled && !hasRecentCache) return button;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {disabled
            ? 'Aplique filtros que retornem ao menos 1 interação'
            : 'Resumo recente disponível em cache (válido 24h)'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
