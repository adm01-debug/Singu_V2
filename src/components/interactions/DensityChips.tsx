import React from 'react';
import { Rows3, Rows2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type DensityMode = 'comfortable' | 'compact';

interface Props {
  value: DensityMode;
  onChange: (value: DensityMode) => void;
}

interface ItemConfig {
  key: DensityMode;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ITEMS: ItemConfig[] = [
  { key: 'comfortable', label: 'Confortável', icon: Rows3 },
  { key: 'compact', label: 'Compacta', icon: Rows2 },
];

export const DensityChips = React.memo(function DensityChips({ value, onChange }: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <div
        className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5"
        role="group"
        aria-label="Densidade da lista"
      >
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const active = value === key;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={label}
                  onClick={() => {
                    if (active) return;
                    onChange(key);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-medium transition-colors',
                    active
                      ? 'border border-primary bg-primary/10 text-foreground'
                      : 'border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
});
