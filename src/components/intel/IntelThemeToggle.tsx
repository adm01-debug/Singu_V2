import { Palette } from 'lucide-react';
import { useIntelTheme } from '@/hooks/useIntelTheme';

/**
 * Toggle compacto entre os temas cyan ↔ amber do Intelligence Hub.
 */
export const IntelThemeToggle = () => {
  const { theme, toggle } = useIntelTheme();
  const next = theme === 'cyan' ? 'amber' : 'cyan';
  return (
    <button
      type="button"
      onClick={toggle}
      className="h-7 px-2 inline-flex items-center gap-1.5 intel-mono text-[10px] uppercase border border-border rounded-sm hover:border-[hsl(var(--intel-accent))]"
      aria-label={`Alternar para tema ${next}`}
      title={`Tema atual: ${theme}. Clique para ${next}.`}
    >
      <Palette className="h-3 w-3" aria-hidden /> THEME:{theme.toUpperCase()}
    </button>
  );
};
