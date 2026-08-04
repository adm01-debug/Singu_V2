import { useMemo } from 'react';
import { StickyNote, Trash2, Loader2, Check } from 'lucide-react';
import { SectionFrame } from './SectionFrame';
import { useEntityNotes } from '@/hooks/useEntityNotes';

interface EntityNotesPanelProps {
  entityKey: string;
  entityName: string;
  onClose: () => void;
}

const formatRelative = (ts: number): string => {
  if (!ts) return 'sem registro';
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'agora';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m atrás`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h atrás`;
  return new Date(ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

/**
 * Painel de anotações livres por entidade — autosave em localStorage com debounce.
 */
export const EntityNotesPanel = ({ entityKey, entityName, onClose }: EntityNotesPanelProps) => {
  const { text, updatedAt, saving, update, clear } = useEntityNotes(entityKey);

  const status = useMemo(() => {
    if (saving) return { label: 'SAVING…', icon: Loader2, spin: true };
    if (updatedAt > 0) return { label: `SAVED · ${formatRelative(updatedAt)}`, icon: Check, spin: false };
    return { label: 'EMPTY', icon: StickyNote, spin: false };
  }, [saving, updatedAt]);

  const Icon = status.icon;

  return (
    <SectionFrame
      title="ENTITY_NOTE"
      meta={status.label}
      actions={
        <div className="flex items-center gap-1.5">
          {text && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Apagar nota de ${entityName}?`)) clear();
              }}
              className="intel-mono text-[10px] text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
              aria-label="Apagar nota"
              title="Apagar nota"
            >
              <Trash2 className="h-3 w-3" aria-hidden /> CLEAR
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="intel-mono text-[10px] text-muted-foreground hover:text-foreground"
            aria-label="Fechar nota"
          >
            CLOSE
          </button>
        </div>
      }
    >
      <p className="intel-mono text-[10px] text-muted-foreground mb-2 inline-flex items-center gap-1.5">
        <Icon
          className={`h-3 w-3 ${status.spin ? 'animate-spin' : ''} text-[hsl(var(--intel-accent))]`}
          aria-hidden
        />
        Anotações sobre <span className="text-foreground">{entityName}</span> · persistido localmente
      </p>
      <textarea
        value={text}
        onChange={(e) => update(e.target.value)}
        placeholder="Escreva hipóteses, observações ou contexto desta investigação…"
        rows={5}
        maxLength={4000}
        className="w-full intel-mono text-xs bg-[hsl(var(--intel-surface-2)/0.4)] border border-border rounded-sm p-2 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--intel-accent))] resize-y"
        aria-label="Anotações da entidade"
      />
      <p className="intel-mono text-[10px] text-muted-foreground mt-1 text-right">
        {text.length}/4000
      </p>
    </SectionFrame>
  );
};
