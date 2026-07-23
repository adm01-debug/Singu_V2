import { useMemo } from 'react';
import { Flame } from 'lucide-react';
import type { AiGatewayHeatmapCell, AiGatewayWorstWindow } from '@/hooks/useAiGatewayHealth';

const DOW_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

function cellColor(pct: number | null): string {
  if (pct == null || pct === 0) return 'bg-muted/40';
  if (pct < 1) return 'bg-emerald-500/30';
  if (pct < 3) return 'bg-yellow-500/40';
  if (pct < 7) return 'bg-orange-500/50';
  return 'bg-destructive/70';
}

interface Props {
  heatmap: AiGatewayHeatmapCell[];
  worst: AiGatewayWorstWindow[];
}

export function AiGatewayErrorHeatmap({ heatmap, worst }: Props) {
  const grid = useMemo(() => {
    const map = new Map<string, AiGatewayHeatmapCell>();
    for (const c of heatmap) map.set(`${c.dow}-${c.hour}`, c);
    return map;
  }, [heatmap]);

  if (heatmap.length === 0) return null;

  return (
    <div className="pt-2 border-t">
      <div className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
        <Flame className="w-3 h-3" /> Heatmap de erros (dia × hora)
      </div>
      <div className="overflow-x-auto">
        <table className="text-[10px] tabular-nums">
          <thead>
            <tr>
              <th className="w-8"></th>
              {Array.from({ length: 24 }, (_, h) => (
                <th key={h} className="w-4 text-center text-muted-foreground font-normal">
                  {h % 3 === 0 ? h : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DOW_LABELS.map((label, idx) => {
              const dow = idx + 1;
              return (
                <tr key={dow}>
                  <td className="pr-2 text-muted-foreground">{label}</td>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = grid.get(`${dow}-${h}`);
                    const pct = cell?.error_rate_pct ?? null;
                    const title = cell
                      ? `${label} ${h}h · ${cell.requests} req · ${cell.errors} erros${pct != null ? ` (${pct}%)` : ''}`
                      : `${label} ${h}h · sem dados`;
                    return (
                      <td key={h} className="p-[1px]">
                        <div
                          className={`h-4 w-4 rounded-sm ${cellColor(pct)}`}
                          title={title}
                          aria-label={title}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {worst.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Piores janelas:{' '}
          {worst.map((w, i) => (
            <span key={`${w.dow}-${w.hour}`}>
              <strong className="text-foreground">
                {DOW_LABELS[w.dow - 1]} {w.hour}h
              </strong>{' '}
              ({w.error_rate_pct}% · {w.errors}/{w.requests})
              {i < worst.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}