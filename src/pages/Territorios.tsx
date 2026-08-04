import { useState, useMemo } from 'react';
import { MapPin, Plus, Search, LayoutGrid, Map } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTerritories, useTerritoryPerformance } from '@/hooks/useTerritories';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { TerritoryCard } from '@/components/territories/TerritoryCard';
import { TerritoryForm } from '@/components/territories/TerritoryForm';
import { TerritoryMap } from '@/components/territories/TerritoryMap';
import { BRAZILIAN_STATES } from '@/lib/brazilianStates';

export default function Territorios() {
  const { data: territories = [], isLoading } = useTerritories();
  const { data: performances = [] } = useTerritoryPerformance();
  const { isAdmin } = useIsAdmin();

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<'cards' | 'map'>('cards');

  const perfMap = useMemo(() => {
    const m: Record<string, (typeof performances)[0]> = {};
    performances.forEach(p => { m[p.territory_id] = p; });
    return m;
  }, [performances]);

  const filtered = useMemo(() => {
    let list = territories;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assigned_to_name?.toLowerCase().includes(q)
      );
    }
    if (stateFilter !== 'all') {
      list = list.filter(t => t.state?.includes(stateFilter));
    }
    return list;
  }, [territories, search, stateFilter]);

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Territórios</h1>
          <span className="text-sm text-muted-foreground">({filtered.length})</span>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Território
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar território..."
            className="pl-9 h-9"
          />
        </div>
        <Select value={stateFilter} onValueChange={setStateFilter}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {BRAZILIAN_STATES.map(st => (
              <SelectItem key={st.uf} value={st.uf}>{st.uf} - {st.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex border rounded-md overflow-hidden">
          <button
            type="button"
            onClick={() => setView('cards')}
            className={`p-2 transition-colors ${view === 'cards' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            aria-label="Visualizar em cards"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setView('map')}
            className={`p-2 transition-colors ${view === 'map' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            aria-label="Visualizar no mapa"
          >
            <Map className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : view === 'cards' ? (
        filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Nenhum território encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(t => (
              <TerritoryCard
                key={t.id}
                territory={t}
                performance={perfMap[t.id]}
              />
            ))}
          </div>
        )
      ) : (
        <TerritoryMap territories={filtered} />
      )}

      {/* Form modal */}
      {showForm && (
        <TerritoryForm open={showForm} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}
