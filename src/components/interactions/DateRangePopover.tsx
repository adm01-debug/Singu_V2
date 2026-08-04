import React, { useEffect, useMemo, useState } from 'react';
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Props {
  de?: Date;
  ate?: Date;
  /** Aplica datas atomicamente. Retorna true se o hook precisou trocar de/até. */
  applyDateRange: (de?: Date, ate?: Date) => boolean;
  /**
   * Limpa `de` e `ate` em uma única operação atômica. Quando fornecida, é
   * usada pelo botão "Limpar período" e pelo atalho Alt+D — preferível a
   * `applyDateRange(undefined, undefined)` por explicitar a intenção.
   * Retorna `true` se removeu algo, `false` se já estava vazio.
   */
  clearDateRange?: () => boolean;
}

interface Preset {
  key: string;
  label: string;
  build: (now: Date) => { de: Date; ate: Date };
}

const PRESETS: Preset[] = [
  { key: 'today', label: 'Hoje', build: (n) => ({ de: startOfDay(n), ate: endOfDay(n) }) },
  { key: 'last7', label: 'Últimos 7 dias', build: (n) => ({ de: startOfDay(subDays(n, 6)), ate: endOfDay(n) }) },
  { key: 'last30', label: 'Últimos 30 dias', build: (n) => ({ de: startOfDay(subDays(n, 29)), ate: endOfDay(n) }) },
  { key: 'thisMonth', label: 'Este mês', build: (n) => ({ de: startOfMonth(n), ate: endOfMonth(n) }) },
  { key: 'lastMonth', label: 'Mês passado', build: (n) => { const prev = subMonths(n, 1); return { de: startOfMonth(prev), ate: endOfMonth(prev) }; } },
];

function fmt(d: Date) { return format(d, 'd MMM', { locale: ptBR }); }

export const DateRangePopover = React.memo(function DateRangePopover({ de, ate, applyDateRange, clearDateRange }: Props) {
  const [open, setOpen] = useState(false);

  const triggerLabel = useMemo(() => {
    if (de && ate) return `${fmt(de)} – ${fmt(ate)}`;
    if (de) return `A partir de ${fmt(de)}`;
    if (ate) return `Até ${fmt(ate)}`;
    return 'Período';
  }, [de, ate]);

  const isActive = !!(de || ate);

  const handleApply = (nextDe?: Date, nextAte?: Date) => {
    const swapped = applyDateRange(nextDe, nextAte);
    if (swapped) toast.info('Datas invertidas — corrigimos o intervalo automaticamente.');
  };

  const handlePreset = (p: Preset) => {
    const { de: d, ate: a } = p.build(new Date());
    applyDateRange(d, a);
    setOpen(false);
  };

  // Helper único de limpeza: usa a função atômica do hook quando fornecida
  // (single setSearchParams), com fallback transparente para applyDateRange
  // — ambas removem `de` e `ate` em uma única operação. Centralizar aqui
  // evita divergência entre os 3 callers (botão "Limpar", X inline, Alt+D).
  const clearRange = (): boolean => {
    const had = !!(de || ate);
    if (clearDateRange) clearDateRange();
    else applyDateRange(undefined, undefined);
    return had;
  };

  const handleClear = () => {
    const had = clearRange();
    setOpen(false);
    if (had) {
      toast.success('Período removido', {
        description: 'Outros filtros foram mantidos.',
        duration: 2000,
      });
    }
  };

  // Atalho global Alt+D: limpa APENAS o filtro de datas (de/ate), preservando
  // canais, busca, sentimento e demais filtros. Ignorado se já não houver
  // datas aplicadas (no-op silencioso) ou se o foco está em campo editável,
  // para não conflitar com texto que use a tecla "d".
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key.toLowerCase() !== 'd') return;
      const tgt = e.target as HTMLElement | null;
      const tag = tgt?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tgt?.isContentEditable) return;
      if (!de && !ate) return;
      e.preventDefault();
      if (clearDateRange) clearDateRange();
      else applyDateRange(undefined, undefined);
      setOpen(false);
      toast.success('Filtro de datas limpo', {
        description: 'Apenas o período foi removido — outros filtros mantidos.',
        duration: 2000,
      });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [de, ate, applyDateRange, clearDateRange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'justify-start gap-2',
            !isActive && 'text-muted-foreground',
            isActive && 'border-primary text-foreground'
          )}
        >
          <CalendarIcon className="w-4 h-4" />
          <span className="truncate max-w-[180px]">{triggerLabel}</span>
          {isActive && (
            <X
              className="w-3.5 h-3.5 ml-1 opacity-60 hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); clearRange(); }}
              aria-label="Limpar período"
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="flex flex-col gap-1 p-3 border-r border-border min-w-[160px]">
            <p className="text-xs font-medium text-muted-foreground px-2 py-1">Atalhos</p>
            {PRESETS.map(p => (
              <Button
                key={p.key}
                variant="ghost"
                size="sm"
                className="justify-start h-8 font-normal"
                onClick={() => handlePreset(p)}
              >
                {p.label}
              </Button>
            ))}
            <Separator className="my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="justify-start h-8 font-normal text-muted-foreground"
              onClick={handleClear}
              disabled={!isActive}
            >
              Limpar período
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row">
            <div className="p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1 px-1">De</p>
              <Calendar
                mode="single"
                selected={de}
                onSelect={(d) => handleApply(d, ate)}
                initialFocus
                className={cn('p-0 pointer-events-auto')}
              />
            </div>
            <div className="p-3 border-t sm:border-t-0 sm:border-l border-border">
              <p className="text-xs font-medium text-muted-foreground mb-1 px-1">Até</p>
              <Calendar
                mode="single"
                selected={ate}
                onSelect={(d) => handleApply(de, d)}
                className={cn('p-0 pointer-events-auto')}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});
