import { Grid3X3, List, Table2, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type ViewMode = 'grid' | 'list' | 'table';
export type GridColumns = 2 | 3 | 4 | 5 | 6;

interface ViewModeSwitcherProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  gridColumns?: GridColumns;
  onGridColumnsChange?: (cols: GridColumns) => void;
  className?: string;
}

const modes = [
  { value: 'grid' as const, icon: Grid3X3, label: 'Grid' },
  { value: 'list' as const, icon: List, label: 'Lista' },
  { value: 'table' as const, icon: Table2, label: 'Tabela' },
];

const columnOptions: GridColumns[] = [2, 3, 4, 5, 6];

function ColumnIcon({ cols, active }: { cols: number; active: boolean }) {
  // Each column icon is a set of vertical bars inside a fixed-width container
  const barWidth = cols <= 3 ? 3 : 2;
  const gap = cols <= 3 ? 2 : 1.5;
  return (
    <div className="flex items-center justify-center" style={{ gap: `${gap}px` }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          style={{ width: `${barWidth}px`, height: '12px', borderRadius: '1px' }}
          className={cn(
            'transition-colors',
            active ? 'bg-primary-foreground' : 'bg-muted-foreground/60'
          )}
        />
      ))}
    </div>
  );
}

export function ViewModeSwitcher({ value, onChange, gridColumns = 3, onGridColumnsChange, className }: ViewModeSwitcherProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-2 text-xs font-medium h-11 px-4 md:h-9 md:px-3 border-border/60 bg-card hover:bg-muted/60',
            className
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Layout
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[260px] p-0 border-border/40 bg-[hsl(var(--card))] shadow-none rounded-xl overflow-hidden"
      >
        {/* Visualização */}
        <div className="px-4 pt-4 pb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
            Visualização
          </span>
          <div className="flex items-center bg-secondary/40 rounded-lg p-1">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isActive = value === mode.value;
              return (
                <button
                  key={mode.value}
                  onClick={() => onChange(mode.value)}
                  className={cn(
                    'flex items-center gap-1.5 h-11 px-3 md:h-8 rounded-md text-xs font-medium transition-colors flex-1 justify-center whitespace-nowrap',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Colunas - only in grid mode */}
        {value === 'grid' && onGridColumnsChange && (
          <div className="px-4 pb-4 pt-1 border-t border-border/20">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Colunas
            </span>
            <div className="flex items-center gap-1.5">
              {columnOptions.map((cols) => {
                const isActive = gridColumns === cols;
                return (
                  <button
                    key={cols}
                    onClick={() => onGridColumnsChange(cols)}
                    className={cn(
                      'flex items-center justify-center h-9 flex-1 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                    )}
                    title={`${cols} colunas`}
                  >
                    <ColumnIcon cols={cols} active={isActive} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
