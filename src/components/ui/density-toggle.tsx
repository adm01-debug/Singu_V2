import { AlignJustify, StretchHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { TableDensity } from '@/hooks/useTableDensity';

interface DensityToggleProps {
  density: TableDensity;
  onToggle: () => void;
  className?: string;
}

export function DensityToggle({ density, onToggle, className }: DensityToggleProps) {
  const isCompact = density === 'compact';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onToggle}
          className={cn('shrink-0', className)}
          aria-label={isCompact ? 'Visualização confortável' : 'Visualização compacta'}
        >
          {isCompact ? (
            <StretchHorizontal className="h-4 w-4" />
          ) : (
            <AlignJustify className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {isCompact ? 'Modo confortável' : 'Modo compacto'}
      </TooltipContent>
    </Tooltip>
  );
}
