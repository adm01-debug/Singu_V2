import { Rows3, Rows2 } from 'lucide-react';
import { useIntelDensity } from '@/hooks/useIntelDensity';

/**
 * Toggle compact/comfortable do Intelligence Hub. Controla classe global
 * .intel-density-compact via hook.
 */
export const IntelDensityToggle = () => {
  const { isCompact, toggle } = useIntelDensity();
  const label = isCompact ? 'COMPACT' : 'COMFORT';
  const Icon = isCompact ? Rows2 : Rows3;
  return (
    <button
      type="button"
      onClick={toggle}
      className="intel-mono text-[10px] uppercase text-muted-foreground hover:text-foreground inline-flex items-center gap-1 border border-border px-1.5 py-0.5 rounded-sm"
      aria-label={`Alternar densidade (atual: ${label})`}
      aria-pressed={isCompact}
      title={`Densidade: ${label}`}
    >
      <Icon className="h-3 w-3" aria-hidden /> {label}
    </button>
  );
};
