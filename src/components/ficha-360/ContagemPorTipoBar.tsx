import { MessageSquare, Phone, Mail, Users, StickyNote, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Props {
  totals: Record<string, number>;
  filtered: Record<string, number>;
  isLoading?: boolean;
}

interface ChannelDef {
  key: string;
  label: string;
  Icon: LucideIcon;
}

const CHANNELS: ChannelDef[] = [
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageSquare },
  { key: 'call', label: 'Ligação', Icon: Phone },
  { key: 'email', label: 'Email', Icon: Mail },
  { key: 'meeting', label: 'Reunião', Icon: Users },
  { key: 'note', label: 'Nota', Icon: StickyNote },
];

/**
 * Faixa compacta com contadores X/Y por canal exibida no topo do card
 * "Últimas Interações". X = passa pelos filtros ativos, Y = total no período.
 *
 * Não tem interação por clique — apenas visualização. Esconde-se quando não
 * há nenhuma interação no período.
 */
export function ContagemPorTipoBar({ totals, filtered, isLoading }: Props) {
  if (isLoading) {
    return (
      <div
        role="group"
        aria-label="Resumo por tipo de interação"
        className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs"
      >
        <span className="text-muted-foreground">Por tipo:</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
    );
  }

  const hasAnyData = CHANNELS.some((c) => (totals[c.key] ?? 0) > 0);
  if (!hasAnyData) return null;

  return (
    <div
      role="group"
      aria-label="Resumo por tipo de interação"
      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs"
    >
      <span className="text-muted-foreground font-medium">Por tipo:</span>
      {CHANNELS.map((c, idx) => {
        const y = totals[c.key] ?? 0;
        const x = filtered[c.key] ?? 0;
        const empty = y === 0;
        const filteredOut = !empty && x === 0;
        const partial = !empty && x > 0 && x < y;
        const Icon = c.Icon;

        return (
          <div
            key={c.key}
            className={cn(
              'inline-flex items-center gap-1 tabular-nums',
              empty && 'opacity-40',
              filteredOut && 'opacity-60 text-muted-foreground',
            )}
            aria-label={`${c.label}: ${x} de ${y} interações visíveis`}
          >
            <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span>{c.label}</span>
            <span>
              <span className={cn(partial && 'text-primary font-medium')}>{x}</span>
              <span className="text-muted-foreground">/{y}</span>
            </span>
            {idx < CHANNELS.length - 1 && (
              <span aria-hidden="true" className="text-muted-foreground/40 ml-2 -mr-1">
                ·
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
