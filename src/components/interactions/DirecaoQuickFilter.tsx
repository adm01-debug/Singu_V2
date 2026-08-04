import React from 'react';
import { ArrowDownLeft, ArrowUpRight, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DirecaoValue = 'all' | 'inbound' | 'outbound';

interface Props {
  value: DirecaoValue;
  onChange: (next: DirecaoValue) => void;
}

const OPTIONS: { value: DirecaoValue; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'all', label: 'Todas', Icon: Layers },
  { value: 'inbound', label: 'Recebidas', Icon: ArrowDownLeft },
  { value: 'outbound', label: 'Enviadas', Icon: ArrowUpRight },
];

export const DirecaoQuickFilter = React.memo(function DirecaoQuickFilter({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5" role="group" aria-label="Direção da interação">
      {OPTIONS.map(({ value: v, label, Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={active}
            title={label}
            className={cn(
              'inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
});
