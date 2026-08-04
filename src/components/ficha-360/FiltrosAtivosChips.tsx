import { memo } from 'react';
import { Calendar, MessageSquare, Phone, Mail, FileText, Search, X, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Ficha360Period } from '@/hooks/useFicha360Filters';
import { TAG_DICTIONARY, type InteractionTag } from '@/lib/interactionTags';

const CHANNEL_META: Record<string, { label: string; icon: typeof MessageSquare }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageSquare },
  call: { label: 'Ligação', icon: Phone },
  email: { label: 'Email', icon: Mail },
  meeting: { label: 'Reunião', icon: Calendar },
  note: { label: 'Nota', icon: FileText },
};

const PERIOD_LABEL: Record<number, string> = {
  7: '7d',
  30: '30d',
  90: '90d',
  365: '1a',
};

interface Props {
  days: Ficha360Period;
  channels: string[];
  tags?: InteractionTag[];
  shownCount: number;
  totalCount: number;
  searchTerm?: string;
  searchMatchCount?: number;
  onRemoveDays: () => void;
  onRemoveChannel: (c: string) => void;
  onRemoveTag?: (t: InteractionTag) => void;
  onRemoveSearch?: () => void;
  onClearAll: () => void;
}

export const FiltrosAtivosChips = memo(function FiltrosAtivosChips({
  days,
  channels,
  tags,
  shownCount,
  totalCount,
  searchTerm,
  searchMatchCount,
  onRemoveDays,
  onRemoveChannel,
  onRemoveTag,
  onRemoveSearch,
  onClearAll,
}: Props) {
  const hasPeriodChip = days !== 90;
  const safeChannels = Array.isArray(channels) ? channels : [];
  const safeTags = Array.isArray(tags) ? tags : [];
  const trimmedSearch = (searchTerm ?? '').trim();
  const hasSearchChip = trimmedSearch.length > 0;
  const activeChipCount =
    (hasPeriodChip ? 1 : 0) + safeChannels.length + safeTags.length + (hasSearchChip ? 1 : 0);

  if (totalCount === 0 && activeChipCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {totalCount > 0 && (
        <span className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{shownCount}</span> de {totalCount}{' '}
          interação{totalCount === 1 ? '' : 'ões'}
        </span>
      )}

      {hasPeriodChip && (
        <Badge
          variant="secondary"
          closeable
          onClose={onRemoveDays}
          icon={<Calendar className="h-3 w-3" />}
          className="text-xs"
          title="Atalho: Shift + P"
        >
          Período: {PERIOD_LABEL[days] ?? `${days}d`}
        </Badge>
      )}

      {safeChannels.map((c, idx) => {
        const meta = CHANNEL_META[c] ?? { label: c, icon: FileText };
        const Icon = meta.icon;
        const shortcutHint = idx < 5 ? ` · Atalho: Shift + ${idx + 1}` : '';
        return (
          <Badge
            key={c}
            variant="secondary"
            closeable
            onClose={() => onRemoveChannel(c)}
            icon={<Icon className="h-3 w-3" />}
            className="text-xs"
            title={`Remover canal${shortcutHint}`}
          >
            {meta.label}
          </Badge>
        );
      })}

      {safeTags.map((t) => {
        const meta = TAG_DICTIONARY[t];
        if (!meta || !onRemoveTag) return null;
        return (
          <Badge
            key={t}
            variant="secondary"
            closeable
            onClose={() => onRemoveTag(t)}
            icon={<Tag className="h-3 w-3" />}
            className="text-xs"
            title="Remover tag"
          >
            {meta.label}
          </Badge>
        );
      })}

      {hasSearchChip && onRemoveSearch && (
        <Badge
          variant="secondary"
          closeable
          onClose={onRemoveSearch}
          icon={<Search className="h-3 w-3" />}
          className="text-xs"
          title="Atalho: Shift + B"
        >
          Busca: “{trimmedSearch}”
          {typeof searchMatchCount === 'number' && (
            <span className="ml-1 tabular-nums opacity-80">· {searchMatchCount}</span>
          )}
        </Badge>
      )}

      {activeChipCount >= 2 && (
        <Button
          variant="ghost"
          size="xs"
          onClick={onClearAll}
          className="ml-auto gap-1 text-muted-foreground"
          title="Atalho: Shift + C"
        >
          <X className="h-3 w-3" /> Limpar tudo
        </Button>
      )}
    </div>
  );
});
