import { memo, useState } from 'react';
import { History, Heart, Sparkles, Plus, Minus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InlineEmptyState } from '@/components/ui/empty-state';
import {
  useContactTagsHistory,
  type TagHistoryEvent,
  type TagCategory,
  type TagDiff,
} from '@/hooks/useContactTagsHistory';

interface Props {
  contactId: string;
}

const CATEGORY_META: Record<TagCategory, { label: string; icon: typeof Heart }> = {
  hobbies: { label: 'Hobbies', icon: Heart },
  interests: { label: 'Interesses', icon: Sparkles },
};

const DiffChips = ({ diff }: { diff: TagDiff }) => (
  <div className="flex flex-wrap gap-1">
    {diff.added.map((item) => (
      <Badge
        key={`add-${item}`}
        variant="outline"
        className="text-[11px] font-normal border-success/40 bg-success/10 text-success gap-0.5"
      >
        <Plus className="h-2.5 w-2.5" aria-hidden />
        {item}
      </Badge>
    ))}
    {diff.removed.map((item) => (
      <Badge
        key={`rem-${item}`}
        variant="outline"
        className="text-[11px] font-normal border-destructive/40 bg-destructive/10 text-destructive gap-0.5 line-through decoration-destructive/60"
      >
        <Minus className="h-2.5 w-2.5 no-underline" aria-hidden />
        {item}
      </Badge>
    ))}
  </div>
);

const EventItem = ({ event, isLast }: { event: TagHistoryEvent; isLast: boolean }) => {
  const when = formatDistanceToNow(new Date(event.createdAt), { addSuffix: true, locale: ptBR });
  const cats = Object.entries(event.changes) as Array<[TagCategory, TagDiff]>;

  return (
    <li className="relative pl-6">
      {/* timeline dot + line */}
      <span
        className="absolute left-[7px] top-1.5 h-2 w-2 rounded-full bg-primary border-2 border-background"
        aria-hidden
      />
      {!isLast && (
        <span
          className="absolute left-[10px] top-4 bottom-0 w-px bg-border"
          aria-hidden
        />
      )}
      <div className="pb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-xs font-medium text-foreground">{when}</p>
          <span className="text-[11px] text-muted-foreground">· Sistema</span>
        </div>
        <div className="space-y-2">
          {cats.map(([cat, diff]) => {
            const { label, icon: Icon } = CATEGORY_META[cat];
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Icon className="h-3 w-3" aria-hidden />
                  <span className="font-medium">{label}</span>
                </div>
                <DiffChips diff={diff} />
              </div>
            );
          })}
        </div>
      </div>
    </li>
  );
};

export const HistoricoTagsCard = memo(({ contactId }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useContactTagsHistory(contactId);
  const events = Array.isArray(data) ? data : [];
  const visible = expanded ? events : events.slice(0, 10);
  const hasMore = events.length > 10;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" />
          Evolução das Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-3/4" />
          </div>
        ) : events.length === 0 ? (
          <InlineEmptyState
            icon={History}
            title="Nenhuma mudança registrada ainda"
            description="Alterações em hobbies e interesses do contato aparecerão aqui automaticamente."
          />
        ) : (
          <>
            <ul className="space-y-0">
              {visible.map((ev, i) => (
                <EventItem key={ev.id} event={ev} isLast={i === visible.length - 1} />
              ))}
            </ul>
            {hasMore && !expanded && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-xs"
                onClick={() => setExpanded(true)}
              >
                Ver mais ({events.length - 10})
              </Button>
            )}
            {expanded && hasMore && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-xs"
                onClick={() => setExpanded(false)}
              >
                Ver menos
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
});
HistoricoTagsCard.displayName = 'HistoricoTagsCard';
