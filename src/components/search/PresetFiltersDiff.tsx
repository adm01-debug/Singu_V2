import React, { useMemo } from 'react';
import { ArrowRight, Plus, Minus, Equal } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterMap = Record<string, string[] | undefined>;

interface Props {
  /** Estado atual salvo no preset (antes). */
  before: FilterMap;
  /** Filtros ativos agora que substituirão (depois). */
  after: FilterMap;
  /** Mapa opcional para humanizar chaves técnicas (ex: { canais: 'Canais' }). */
  labelFor?: Record<string, string>;
  /** Mostra também chaves sem mudança (default: false). */
  includeUnchanged?: boolean;
}

interface DiffRow {
  key: string;
  label: string;
  status: 'added' | 'removed' | 'changed' | 'unchanged';
  before: string[];
  after: string[];
}

function normalize(values: string[] | undefined): string[] {
  if (!values) return [];
  return values
    .map((v) => (typeof v === 'string' ? v.trim() : String(v)))
    .filter((v) => v.length > 0);
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}

function defaultLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export const PresetFiltersDiff = React.memo(function PresetFiltersDiff({
  before,
  after,
  labelFor,
  includeUnchanged = false,
}: Props) {
  const rows = useMemo<DiffRow[]>(() => {
    const keys = new Set<string>([
      ...Object.keys(before ?? {}),
      ...Object.keys(after ?? {}),
    ]);
    const out: DiffRow[] = [];
    for (const key of keys) {
      const b = normalize(before?.[key]);
      const a = normalize(after?.[key]);
      if (b.length === 0 && a.length === 0) continue;
      let status: DiffRow['status'];
      if (b.length === 0 && a.length > 0) status = 'added';
      else if (b.length > 0 && a.length === 0) status = 'removed';
      else if (arraysEqual(a, b)) status = 'unchanged';
      else status = 'changed';
      if (status === 'unchanged' && !includeUnchanged) continue;
      out.push({
        key,
        label: labelFor?.[key] ?? defaultLabel(key),
        status,
        before: b,
        after: a,
      });
    }
    // Ordem: changed, added, removed, unchanged
    const order: Record<DiffRow['status'], number> = {
      changed: 0, added: 1, removed: 2, unchanged: 3,
    };
    out.sort((x, y) => order[x.status] - order[y.status] || x.label.localeCompare(y.label));
    return out;
  }, [before, after, labelFor, includeUnchanged]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Nenhuma mudança detectada — os filtros já são iguais.
      </p>
    );
  }

  return (
    <div className="rounded-md border border-border bg-muted/30 divide-y divide-border max-h-64 overflow-y-auto">
      {rows.map((row) => (
        <DiffRowItem key={row.key} row={row} />
      ))}
    </div>
  );
});

function StatusIcon({ status }: { status: DiffRow['status'] }) {
  const cls = 'w-3 h-3 shrink-0';
  if (status === 'added') return <Plus className={cn(cls, 'text-success')} aria-label="Adicionado" />;
  if (status === 'removed') return <Minus className={cn(cls, 'text-destructive')} aria-label="Removido" />;
  if (status === 'changed') return <ArrowRight className={cn(cls, 'text-warning')} aria-label="Alterado" />;
  return <Equal className={cn(cls, 'text-muted-foreground')} aria-label="Sem mudança" />;
}

function ValueChips({
  values,
  variant,
}: {
  values: string[];
  variant: 'before' | 'after' | 'neutral';
}) {
  if (values.length === 0) {
    return <span className="text-xs italic text-muted-foreground">vazio</span>;
  }
  const chipCls = cn(
    'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
    variant === 'before' && 'bg-destructive/10 text-destructive line-through decoration-destructive/40',
    variant === 'after' && 'bg-success/10 text-success',
    variant === 'neutral' && 'bg-muted text-muted-foreground',
  );
  return (
    <span className="inline-flex flex-wrap gap-1">
      {values.map((v, i) => (
        <span key={`${v}-${i}`} className={chipCls}>{v}</span>
      ))}
    </span>
  );
}

function DiffRowItem({ row }: { row: DiffRow }) {
  return (
    <div className="px-2.5 py-2 flex items-start gap-2 text-sm">
      <StatusIcon status={row.status} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-foreground mb-0.5">{row.label}</div>
        {row.status === 'added' && (
          <ValueChips values={row.after} variant="after" />
        )}
        {row.status === 'removed' && (
          <ValueChips values={row.before} variant="before" />
        )}
        {row.status === 'changed' && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <ValueChips values={row.before} variant="before" />
            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
            <ValueChips values={row.after} variant="after" />
          </div>
        )}
        {row.status === 'unchanged' && (
          <ValueChips values={row.after} variant="neutral" />
        )}
      </div>
    </div>
  );
}
