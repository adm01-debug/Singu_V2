import { useMemo, useState } from 'react';
import { GitCompare, Minus, Plus, Pencil } from 'lucide-react';
import { SectionFrame } from './SectionFrame';
import { computeMetadataDiff } from '@/lib/entityDiff';

interface MetadataDiffPanelProps {
  beforeName: string;
  afterName: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  onClose: () => void;
}

export const MetadataDiffPanel = ({ beforeName, afterName, before, after, onClose }: MetadataDiffPanelProps) => {
  const [showEqual, setShowEqual] = useState(false);
  const rows = useMemo(() => computeMetadataDiff(before, after), [before, after]);
  const visible = showEqual ? rows : rows.filter((r) => r.status !== 'equal');

  return (
    <SectionFrame
      title="METADATA_DIFF"
      meta={`${visible.length} CHANGES`}
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
      <p className="intel-mono text-[10px] text-muted-foreground mb-2">
        <GitCompare className="h-3 w-3 inline-block mr-1 align-text-bottom" aria-hidden />
        Comparando <span className="text-[hsl(var(--intel-accent))]">{beforeName}</span> → <span className="text-foreground">{afterName}</span>
      </p>
      {visible.length === 0 ? (
        <p className="intel-mono text-[10px] text-muted-foreground">NO_DIFFERENCES</p>
      ) : (
        <ul className="space-y-0.5 max-h-[360px] overflow-y-auto">
          {visible.map((r) => {
            const Icon = r.status === 'added' ? Plus : r.status === 'removed' ? Minus : Pencil;
            const sev =
              r.status === 'added'
                ? 'sev-ok'
                : r.status === 'removed'
                ? 'sev-critical'
                : r.status === 'changed'
                ? 'sev-warn'
                : 'muted-foreground';
            const colorClass =
              r.status === 'equal' ? 'text-muted-foreground' : `text-[hsl(var(--${sev}))]`;
            return (
              <li
                key={r.key}
                className="grid grid-cols-[16px_120px_1fr_1fr] gap-2 items-start text-[11px] intel-mono py-0.5 border-b border-border/30"
              >
                <Icon className={`h-3 w-3 mt-0.5 ${colorClass}`} aria-hidden />
                <span className="intel-eyebrow truncate" title={r.key}>{r.key}</span>
                <span className="text-muted-foreground line-through truncate" title={r.before}>
                  {r.before || '∅'}
                </span>
                <span className={`truncate ${colorClass}`} title={r.after}>
                  {r.after || '∅'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionFrame>
  );
};
