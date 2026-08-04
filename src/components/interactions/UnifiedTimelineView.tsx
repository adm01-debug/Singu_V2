import { useState, useMemo } from 'react';
import { Building2, User, Inbox } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { TimelineFilterBar } from './TimelineFilterBar';
import { TimelineGroupCard } from './TimelineGroupCard';
import { useTimelineByEntity, type GroupBy } from '@/hooks/useTimelineByEntity';

export function UnifiedTimelineView() {
  const [groupBy, setGroupBy] = useState<GroupBy>('company');
  const [search, setSearch] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: groups, isLoading } = useTimelineByEntity({ groupBy, dateFrom, dateTo, channels });

  const filteredGroups = useMemo(() => {
    if (!Array.isArray(groups)) return [];
    if (!search.trim()) return groups;
    const lower = search.toLowerCase();
    return groups.filter(g => g.entity_name.toLowerCase().includes(lower));
  }, [groups, search]);

  const handleClear = () => {
    setSearch('');
    setChannels([]);
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-4">
      <Tabs value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="company" className="gap-2">
            <Building2 className="w-4 h-4" /> Por Empresa
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <User className="w-4 h-4" /> Por Pessoa
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <TimelineFilterBar
        search={search}
        onSearchChange={setSearch}
        channels={channels}
        onChannelsChange={setChannels}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onClear={handleClear}
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
        </div>
      ) : filteredGroups.length === 0 ? (
        <EmptyState
          illustration="interactions"
          title="Nenhuma interação encontrada"
          description={
            search || channels.length > 0 || dateFrom || dateTo
              ? 'Ajuste os filtros para ver mais resultados.'
              : 'Comece a registrar interações para visualizá-las aqui.'
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Inbox className="w-3 h-3" />
            {filteredGroups.length} {groupBy === 'company' ? 'empresa(s)' : 'pessoa(s)'} · {filteredGroups.reduce((sum, g) => sum + g.events.length, 0)} interações
          </p>
          {filteredGroups.map((group, idx) => (
            <TimelineGroupCard key={group.entity_id} group={group} defaultOpen={idx < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
