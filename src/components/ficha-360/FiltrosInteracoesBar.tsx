import { memo, type KeyboardEvent } from 'react';
import { MessageSquare, Phone, Mail, Calendar, FileText, X, Layers, RotateCcw, Check, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Ficha360Period } from '@/hooks/useFicha360Filters';

const PERIOD_OPTIONS: Array<{ value: Ficha360Period; label: string }> = [
  { value: 7, label: '7d' },
  { value: 30, label: '30d' },
  { value: 90, label: '90d' },
  { value: 365, label: '1a' },
];

const CHANNEL_OPTIONS: Array<{ value: string; label: string; icon: typeof MessageSquare }> = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Reunião', icon: Calendar },
  { value: 'note', label: 'Nota', icon: FileText },
];

interface Props {
  days: Ficha360Period;
  channels: string[];
  onDaysChange: (d: Ficha360Period) => void;
  onChannelsChange: (c: string[]) => void;
  onClear: () => void;
  activeCount: number;
  shownCount: number;
  totalCount: number;
  channelCounts?: Record<string, number>;
  channelCountsReady?: boolean;
  isDirty?: boolean;
  onApply?: () => void;
  onDiscard?: () => void;
}

export const FiltrosInteracoesBar = memo(function FiltrosInteracoesBar({
  days,
  channels,
  onDaysChange,
  onChannelsChange,
  onClear,
  activeCount,
  shownCount,
  totalCount,
  channelCounts,
  channelCountsReady = false,
  isDirty = false,
  onApply,
  onDiscard,
}: Props) {
  const toggleChannel = (value: string) => {
    if (channels.includes(value)) onChannelsChange(channels.filter((c) => c !== value));
    else onChannelsChange([...channels, value]);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onApply) return;
    if (e.key === 'Enter' && isDirty) {
      e.preventDefault();
      onApply();
    } else if (e.key === 'Escape' && isDirty && onDiscard) {
      e.preventDefault();
      onDiscard();
    }
  };

  return (
    <div className="pt-1" onKeyDown={handleKeyDown} tabIndex={-1}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Período */}
        <div className="inline-flex items-center rounded-md border border-border bg-card p-0.5">
          {PERIOD_OPTIONS.map((opt) => {
            const active = opt.value === days;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onDaysChange(opt.value)}
                className={cn(
                  'h-6 px-2.5 text-xs font-medium rounded transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {days !== 90 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDaysChange(90)}
            className="h-6 px-2 text-xs text-muted-foreground gap-1"
            aria-label="Zerar período para 90 dias"
            title="Voltar para o período padrão (90 dias)"
          >
            <RotateCcw className="h-3 w-3" /> Zerar período
          </Button>
        )}

        {/* Canais */}
        <div className="flex flex-wrap items-center gap-1">
          {CHANNEL_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = channels.includes(opt.value);
            const count = channelCounts?.[opt.value];
            const hasCount = channelCountsReady && typeof count === 'number';
            const isEmpty = hasCount && count === 0 && !active;
            const display = hasCount ? (count > 200 ? '200+' : String(count)) : null;
            return (
              <Badge
                key={opt.value}
                variant={active ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer gap-1 px-2 py-0.5 text-xs transition-colors',
                  !active && 'hover:bg-muted',
                  isEmpty && 'opacity-50',
                )}
                onClick={() => toggleChannel(opt.value)}
                role="button"
                aria-pressed={active}
                title={isEmpty ? `${opt.label} — sem interações no período` : opt.label}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{opt.label}</span>
                {display !== null && (
                  <span
                    className={cn(
                      'ml-0.5 tabular-nums text-[10px] transition-opacity',
                      active ? 'opacity-90' : 'text-muted-foreground',
                    )}
                  >
                    {display}
                  </span>
                )}
              </Badge>
            );
          })}
        </div>

        {channels.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChannelsChange([])}
            className="h-6 px-2 text-xs text-muted-foreground gap-1"
            aria-label="Mostrar todos os canais"
            title="Mostrar todos os canais"
          >
            <Layers className="h-3 w-3" /> Todos
          </Button>
        )}

        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-6 px-2 text-xs text-muted-foreground gap-1"
          >
            <X className="h-3 w-3" /> Limpar
          </Button>
        )}

        {isDirty && onApply && (
          <div
            className="ml-auto flex items-center gap-1.5"
            role="status"
            aria-live="polite"
          >
            <span className="text-xs text-warning">Alterações não aplicadas</span>
            {onDiscard && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDiscard}
                className="h-6 px-2 text-xs gap-1"
                aria-label="Descartar alterações"
                title="Descartar (Esc)"
              >
                <Undo2 className="h-3 w-3" /> Descartar
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={onApply}
              className="h-6 px-2.5 text-xs gap-1"
              aria-label="Aplicar filtros"
              title="Aplicar (Enter)"
            >
              <Check className="h-3 w-3" /> Aplicar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});
