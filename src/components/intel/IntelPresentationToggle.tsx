import { Presentation } from 'lucide-react';
import { useIntelPresentation } from '@/hooks/useIntelPresentation';

export const IntelPresentationToggle = () => {
  const { active, toggle } = useIntelPresentation();
  return (
    <button
      type="button"
      onClick={toggle}
      className={`intel-mono text-[10px] uppercase inline-flex items-center gap-1 border px-1.5 py-0.5 rounded-sm ${
        active
          ? 'text-[hsl(var(--intel-accent))] border-[hsl(var(--intel-accent))]'
          : 'text-muted-foreground hover:text-foreground border-border'
      }`}
      aria-label={active ? 'Desativar modo apresentação' : 'Ativar modo apresentação'}
      aria-pressed={active}
      title={active ? 'Modo apresentação ON' : 'Modo apresentação OFF'}
    >
      <Presentation className="h-3 w-3" aria-hidden /> PRES
    </button>
  );
};
