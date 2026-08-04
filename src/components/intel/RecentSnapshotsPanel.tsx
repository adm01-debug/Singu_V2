import { useCallback } from 'react';
import { Camera, X, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from './SectionFrame';
import { IntelEmptyState } from './IntelEmptyState';
import { useIntelSnapshots } from '@/hooks/useIntelSnapshots';
import { buildShareUrl } from '@/lib/intelSnapshot';
import { format } from 'date-fns';

interface RecentSnapshotsPanelProps {
  onApply: (hash: string) => void;
}

export const RecentSnapshotsPanel = ({ onApply }: RecentSnapshotsPanelProps) => {
  const { items } = useIntelSnapshots();

  const copyLink = useCallback(async (hash: string) => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(hash));
      toast.success('Link do snapshot copiado.');
    } catch {
      toast.error('Falha ao copiar link.');
    }
  }, []);

  return (
    <SectionFrame title="RECENT_SNAPSHOTS" meta={`${items.length}/5`}>
      {items.length === 0 ? (
        <IntelEmptyState
          icon={Camera}
          title="EMPTY"
          description="Use o botão SNAPSHOT no header para salvar o estado atual."
        />
      ) : (
        <ul className="space-y-1">
          {items.map((s) => (
            <li key={s.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onApply(s.hash)}
                className="flex-1 text-left intel-card intel-card-hover px-2 py-1 text-[11px] flex flex-col gap-0.5 min-w-0"
                aria-label={`Aplicar snapshot ${s.label}`}
                title={s.label}
              >
                <span className="text-foreground truncate flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 text-[hsl(var(--intel-accent))] shrink-0" aria-hidden />
                  {s.label}
                </span>
                <span className="intel-mono text-[10px] text-muted-foreground">
                  {format(new Date(s.savedAt), 'dd/MM HH:mm')}
                </span>
              </button>
              <button
                type="button"
                onClick={() => copyLink(s.hash)}
                className="p-1 text-muted-foreground hover:text-[hsl(var(--intel-accent))]"
                aria-label={`Copiar link de ${s.label}`}
                title="Copiar link"
              >
                <Copy className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionFrame>
  );
};

export const SnapshotsPanelEmptySpacer = () => <X className="h-0 w-0" aria-hidden />;
