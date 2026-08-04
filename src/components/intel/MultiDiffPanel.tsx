import { useMemo, useState } from 'react';
import { GitMerge } from 'lucide-react';
import { SectionFrame } from './SectionFrame';

export interface MultiDiffEntity {
  id: string;
  name: string;
  metadata: Record<string, unknown>;
}

interface MultiDiffPanelProps {
  entities: MultiDiffEntity[]; // 2 ou 3
  onClose: () => void;
}

function normalize(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'string') return v.length > 80 ? `${v.slice(0, 80)}…` : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    const s = JSON.stringify(v);
    return s.length > 80 ? `${s.slice(0, 80)}…` : s;
  } catch {
    return String(v);
  }
}

/**
 * Comparação lado-a-lado de até 3 entidades (metadata).
 * Destaca campos divergentes e oculta os iguais por padrão.
 */
export const MultiDiffPanel = ({ entities, onClose }: MultiDiffPanelProps) => {
  const [showEqual, setShowEqual] = useState(false);

  const rows = useMemo(() => {
    const allKeys = new Set<string>();
    entities.forEach((e) => Object.keys(e.metadata || {}).forEach((k) => allKeys.add(k)));
    return Array.from(allKeys)
      .sort()
      .map((key) => {
        const values = entities.map((e) => normalize(e.metadata?.[key]));
        const nonEmpty = values.filter((v) => v !== '');
        const distinct = new Set(values);
        const allEqual = distinct.size === 1;
        const hasGap = nonEmpty.length > 0 && nonEmpty.length < values.length;
        return { key, values, allEqual, hasGap };
      });
  }, [entities]);

  const visible = showEqual ? rows : rows.filter((r) => !r.allEqual);
  const changedCount = rows.filter((r) => !r.allEqual).length;

  return (
    <SectionFrame
      title="MULTI_DIFF"
      meta={`${entities.length}× · ${changedCount} CHANGES`}
      actions={
        <div className="flex items-center gap-1.5">
          <label className="intel-mono text-[10px] text-muted-foreground inline-flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showEqual}
              onChange={(e) => setShowEqual(e.target.checked)}
              className="h-3 w-3"
              aria-label="Mostrar campos iguais"
            />
            SHOW_EQUAL
          </label>
          <button
            type="button"
            onClick={onClose}
            className="intel-mono text-[10px] text-muted-foreground hover:text-foreground"
            aria-label="Fechar diff"
          >
            CLOSE
          </button>
        </div>
      }
    >
      <p className="intel-mono text-[10px] text-muted-foreground mb-2 inline-flex items-center gap-1">
        <GitMerge className="h-3 w-3 text-[hsl(var(--intel-accent))]" aria-hidden />
        Comparando {entities.length} entidades — divergências em <span className="text-[hsl(var(--intel-accent))]">cyan</span>.
      </p>
      <div className="overflow-x-auto max-h-[420px]">
        <table className="w-full text-xs intel-mono border-collapse">
          <thead className="sticky top-0 bg-[hsl(var(--intel-surface-1))] z-10">
            <tr className="border-b border-border">
              <th className="intel-eyebrow text-left py-1.5 pr-2 w-32">CAMPO</th>
              {entities.map((e) => (
                <th
                  key={e.id}
                  className="text-left py-1.5 px-2 text-foreground truncate max-w-[160px]"
                  title={e.name}
                >
                  {e.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={entities.length + 1} className="py-3 text-center text-muted-foreground">
                  NO_DIFFERENCES
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={r.key} className="border-b border-border/30">
                  <td className="intel-eyebrow py-1 pr-2 truncate" title={r.key}>{r.key}</td>
                  {r.values.map((v, i) => (
                    <td
                      key={`${r.key}-${i}`}
                      className={`py-1 px-2 truncate max-w-[160px] ${
                        r.allEqual
                          ? 'text-muted-foreground'
                          : v === ''
                          ? 'text-destructive/70'
                          : 'text-[hsl(var(--intel-accent))]'
                      }`}
                      title={v}
                    >
                      {v || '∅'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </SectionFrame>
  );
};
