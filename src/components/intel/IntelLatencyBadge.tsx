import { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { useIntelTelemetry } from '@/hooks/useIntelTelemetry';

const LIMIT = 20;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/**
 * Badge de latência para a status bar: avg + p95 das últimas 20 queries
 * com durationMs registradas via useIntelTelemetry.
 */
export const IntelLatencyBadge = () => {
  const { events } = useIntelTelemetry();

  const { avg, p95, count } = useMemo(() => {
    const durations = events
      .filter((e) => e.kind === 'query' && typeof e.durationMs === 'number')
      .slice(-LIMIT)
      .map((e) => e.durationMs!) as number[];
    if (durations.length === 0) return { avg: 0, p95: 0, count: 0 };
    const sum = durations.reduce((a, b) => a + b, 0);
    const sorted = [...durations].sort((a, b) => a - b);
    return {
      avg: Math.round(sum / durations.length),
      p95: Math.round(percentile(sorted, 95)),
      count: durations.length,
    };
  }, [events]);

  if (count === 0) return null;

  const sev = avg < 500 ? 'sev-ok' : avg < 2000 ? 'sev-warn' : 'sev-critical';
  const colorClass = `text-[hsl(var(--${sev}))]`;

  return (
    <span className="hidden md:flex items-center gap-1.5" title={`Média e p95 das últimas ${count} queries`}>
      <Gauge className={`h-3 w-3 ${colorClass}`} aria-hidden />
      <span>
        AVG <span className={colorClass}>{avg}ms</span> · P95 <span className={colorClass}>{p95}ms</span>
      </span>
    </span>
  );
};
