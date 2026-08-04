import { Bookmark, X, Play } from 'lucide-react';
import { SectionFrame } from './SectionFrame';
import { IntelEmptyState } from './IntelEmptyState';
import { useSavedAskViews } from '@/hooks/useSavedAskViews';

interface SavedViewsPanelProps {
  onRun: (query: string) => void;
}

export const SavedViewsPanel = ({ onRun }: SavedViewsPanelProps) => {
  const { items, remove, max } = useSavedAskViews();

  return (
    <SectionFrame title="SAVED_VIEWS" meta={`${items.length}/${max}`}>
      {items.length === 0 ? (
        <IntelEmptyState
          icon={Bookmark}
          title="EMPTY"
          description="Salve queries com o botão SAVE em uma resposta para reexecutá-las depois."
        />
      ) : (
        <ul className="space-y-1">
          {items.map((v) => (
            <li key={v.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onRun(v.query)}
                className="flex-1 text-left intel-card intel-card-hover px-2 py-1 text-[11px] flex items-start gap-1.5"
                aria-label={`Reexecutar ${v.name}`}
                title={v.query}
              >
                <Play className="h-3 w-3 text-[hsl(var(--intel-accent))] shrink-0 mt-0.5" aria-hidden />
                <span className="text-foreground truncate flex-1">{v.name}</span>
              </button>
              <button
                type="button"
                onClick={() => remove(v.id)}
                className="p-1 text-muted-foreground hover:text-destructive"
                aria-label={`Remover ${v.name}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionFrame>
  );
};
