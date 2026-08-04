import React from 'react';
import {
  MessageCircle,
  Mail,
  Phone,
  Calendar,
  Linkedin,
  ArrowUpDown,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { NbaPriority, NbaSort } from '@/hooks/useProximosPassosFilters';

const PRIORITIES: { value: NbaPriority; label: string; activeClass: string }[] = [
  { value: 'alta', label: 'Alta', activeClass: 'bg-destructive/10 text-destructive border-destructive/40' },
  { value: 'media', label: 'Média', activeClass: 'bg-warning/10 text-warning border-warning/40' },
  { value: 'baixa', label: 'Baixa', activeClass: 'bg-muted text-muted-foreground border-border' },
];

const CHANNELS: { value: string; label: string; icon: typeof Mail }[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'meeting', label: 'Reunião', icon: Calendar },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

interface Props {
  priorities: NbaPriority[];
  channels: string[];
  sort: NbaSort;
  shownCount: number;
  totalCount: number;
  activeCount: number;
  onTogglePriority: (p: NbaPriority) => void;
  onToggleChannel: (c: string) => void;
  onChangeSort: (s: NbaSort) => void;
  onClear: () => void;
}

function ProximosPassosFiltersBarComponent({
  priorities,
  channels,
  sort,
  shownCount,
  totalCount,
  activeCount,
  onTogglePriority,
  onToggleChannel,
  onChangeSort,
  onClear,
}: Props) {
  return (
    <div className="space-y-2 pt-1">
      {/* Linha 1: chips de prioridade + canal */}
      <div className="flex flex-wrap items-center gap-1.5">
        {PRIORITIES.map((opt) => {
          const active = priorities.includes(opt.value);
          return (
            <Badge
              key={opt.value}
              variant="outline"
              role="button"
              aria-pressed={active}
              onClick={() => onTogglePriority(opt.value)}
              className={cn(
                'cursor-pointer px-2 py-0.5 text-[11px] transition-colors select-none',
                active ? opt.activeClass : 'hover:bg-muted',
              )}
            >
              {opt.label}
            </Badge>
          );
        })}

        <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

        {CHANNELS.map((opt) => {
          const Icon = opt.icon;
          const active = channels.includes(opt.value);
          return (
            <Badge
              key={opt.value}
              variant={active ? 'default' : 'outline'}
              role="button"
              aria-pressed={active}
              title={opt.label}
              onClick={() => onToggleChannel(opt.value)}
              className={cn(
                'cursor-pointer gap-1 px-2 py-0.5 text-[11px] transition-colors select-none',
                !active && 'hover:bg-muted',
              )}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden md:inline">{opt.label}</span>
            </Badge>
          );
        })}
      </div>

      {/* Linha 2: contador + limpar + ordenação */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {activeCount > 0 ? (
            <>
              <span className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{shownCount}</span> de {totalCount}{' '}
                sugest{totalCount === 1 ? 'ão' : 'ões'}
              </span>
              <Button
                variant="ghost"
                size="xs"
                onClick={onClear}
                className="gap-1 text-muted-foreground"
              >
                <X className="h-3 w-3" /> Limpar
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">
              {totalCount} sugest{totalCount === 1 ? 'ão' : 'ões'}
            </span>
          )}
        </div>

        <Select value={sort} onValueChange={(v) => onChangeSort(v as NbaSort)}>
          <SelectTrigger className="h-7 w-auto gap-1.5 px-2 text-xs" aria-label="Ordenar próximos passos">
            <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="sugerido">Sugerido</SelectItem>
            <SelectItem value="recomendacao">Recomendação (score)</SelectItem>
            <SelectItem value="prioridade">Prioridade</SelectItem>
            <SelectItem value="canal">Canal</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export const ProximosPassosFiltersBar = React.memo(ProximosPassosFiltersBarComponent);
