import { Rows3, Rows2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGlobalDensity } from '@/hooks/useGlobalDensity';
import { cn } from '@/lib/utils';

interface GlobalDensityToggleProps {
  className?: string;
}

/**
 * Toggle global de densidade (cozy/compact) para listas e cards do CRM.
 * Não afeta o Intelligence Hub (que usa `useIntelDensity` próprio).
 */
export function GlobalDensityToggle({ className }: GlobalDensityToggleProps) {
  const { isCompact, toggle } = useGlobalDensity();
  const Icon = isCompact ? Rows2 : Rows3;
  const label = isCompact ? 'Densidade compacta' : 'Densidade confortável';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={label}
          aria-pressed={isCompact}
          className={cn('h-8 w-8', className)}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
