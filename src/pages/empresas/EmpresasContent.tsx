import { useState, useMemo, useRef, useEffect, startTransition, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, Plus, CheckSquare, X } from 'lucide-react';
import { CompaniesGridSkeleton } from '@/components/skeletons/PageSkeletons';
import { CompaniesStatsBar } from '@/components/companies/CompaniesStatsBar';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdvancedFilters, type FilterConfig } from '@/components/filters/AdvancedFilters';
import { CompanyCardWithContext } from '@/components/company-card/CompanyCardWithContext';
import { CompanyListItem } from '@/components/companies/CompanyListItem';
import { CompaniesTableView } from '@/components/companies/CompaniesTableView';
import { ViewModeSwitcher, type ViewMode, type GridColumns } from '@/components/ui/view-mode-switcher';
import { BulkActionsBar } from '@/components/bulk-actions/BulkActionsBar';
import { SearchPresetsMenu } from '@/components/search/SearchPresetsMenu';
import { BulkImportDialog } from '@/components/import/BulkImportDialog';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { MergeCompaniesDialog } from '@/components/company-detail/MergeCompaniesDialog';
import { RecentlyViewedSection } from '@/components/recently-viewed/RecentlyViewedSection';
import { CompaniesInlineMap } from '@/components/companies/CompaniesInlineMap';
import { useCompanyGroups, GroupHeader, useGroupExpansion } from '@/components/companies/CompanyGrouping';
import type { Company } from '@/hooks/useCompanies';
import type { SearchPreset } from '@/hooks/useSearchPresets';

interface Props {
  companies: Company[];
  loading: boolean;
  filteredAndSortedCompanies: Company[];
  localSearch: string;
  onSearchChange: (value: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  gridColumns: GridColumns;
  onGridColumnsChange: (cols: GridColumns) => void;
  activeFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  multiSort?: Array<{ column: string; order: 'asc' | 'desc' }>;
  onMultiSortChange?: (criteria: Array<{ column: string; order: 'asc' | 'desc' }>) => void;
  dynamicFilters: FilterConfig[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelectionMode: () => void;
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: () => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkAddTag: (ids: string[], tag: string) => Promise<void>;
  onSetEditingCompany: (company: Company | null) => void;
  onSetDeletingCompany: (company: Company | null) => void;
  onSetIsFormOpen: (open: boolean) => void;
  updateCompany: (id: string, data: Partial<Company>) => Promise<Company>;
  companyMetrics: { contactCountMap: Map<string, number>; lastInteractionMap: Map<string, number> };
  selectedIndex: number;
  triggerSearch: (term: string) => void;
}

export function EmpresasContent(props: Props) {
  const {
    companies, loading, filteredAndSortedCompanies, localSearch, onSearchChange, clearSearch, isSearching,
    viewMode, onViewModeChange, gridColumns, onGridColumnsChange,
    activeFilters, onFiltersChange, sortBy, sortOrder, onSortChange,
    dynamicFilters, selectionMode, selectedIds,
    onToggleSelectionMode, onSelect, onSelectAll, onBulkDelete, onBulkAddTag,
    onSetEditingCompany, onSetDeletingCompany, onSetIsFormOpen,
    updateCompany, companyMetrics, selectedIndex, triggerSearch,
  } = props;

  const { isAdmin } = useIsAdmin();
  const RENDER_BATCH = 60;
  const [visibleCount, setVisibleCount] = useState(RENDER_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { groups, hasGroups } = useCompanyGroups(filteredAndSortedCompanies);
  const { toggle: toggleGroup, isExpanded: isGroupExpanded } = useGroupExpansion(groups);

  useEffect(() => { setVisibleCount(RENDER_BATCH); }, [activeFilters, sortBy, sortOrder, localSearch]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    // eslint-disable-next-line sonarjs/no-nested-functions
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) startTransition(() => setVisibleCount(prev => prev + RENDER_BATCH)); }, { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [filteredAndSortedCompanies.length]);

  const visibleCompanies = useMemo(() => filteredAndSortedCompanies.slice(0, visibleCount), [filteredAndSortedCompanies, visibleCount]);
  const hasMore = visibleCount < filteredAndSortedCompanies.length;

  const handleTableSort = useCallback((field: string) => {
    if (sortBy === field) onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    else onSortChange(field, 'asc');
  }, [sortBy, sortOrder, onSortChange]);

  const handleApplyPreset = useCallback((preset: SearchPreset) => {
    onFiltersChange(preset.filters);
    onSortChange(preset.sortBy, preset.sortOrder);
    const ns = preset.searchTerm || '';
    onSearchChange(ns);
    triggerSearch(ns);
  }, [onFiltersChange, onSortChange, onSearchChange, triggerSearch]);

  const companySortOptions = [
    { value: 'name', label: 'Nome' },
    { value: 'updated_at', label: 'Atualização' },
    { value: 'created_at', label: 'Criação' },
    { value: 'city', label: 'Cidade' },
    { value: 'industry', label: 'Segmento' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <CompaniesStatsBar companies={companies} contactCountMap={companyMetrics.contactCountMap} />
      <CompaniesInlineMap companies={filteredAndSortedCompanies} />

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar empresa, segmento ou cidade..." value={localSearch} onChange={(e) => onSearchChange(e.target.value)} className={`pl-10 ${isSearching ? 'pr-10' : ''}`} />
          {isSearching && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" aria-label="Limpar pesquisa" onClick={clearSearch}><X className="h-4 w-4" /></Button>}
        </div>
        <div className="flex items-center gap-2">
          <SearchPresetsMenu context="companies" buttonLabel="Listas" title="Listas salvas" description="Salve combinações de filtros para segmentar empresas em um clique."
            currentFilters={activeFilters} currentSortBy={sortBy} currentSortOrder={sortOrder} currentSearchTerm={localSearch}
            onApplyPreset={handleApplyPreset} />
          <ViewModeSwitcher value={viewMode} onChange={onViewModeChange} gridColumns={gridColumns} onGridColumnsChange={onGridColumnsChange} />
          {isAdmin && <BulkImportDialog entityType="companies" />}
          {isAdmin && <MergeCompaniesDialog />}
          <Button variant={selectionMode ? 'default' : 'outline'} size="sm" onClick={onToggleSelectionMode} className="gap-2">
            <CheckSquare className="w-4 h-4" />{selectionMode ? 'Cancelar' : 'Selecionar'}
          </Button>
        </div>
      </div>

      <AdvancedFilters 
        filters={dynamicFilters} 
        sortOptions={companySortOptions} 
        activeFilters={activeFilters} 
        onFiltersChange={onFiltersChange} 
        sortBy={sortBy} 
        sortOrder={sortOrder} 
        onSortChange={onSortChange}
        multiSort={props.multiSort}
        onMultiSortChange={props.onMultiSortChange}
      />
      <RecentlyViewedSection type="company" />

      {loading ? <CompaniesGridSkeleton /> : (
        <>
          {viewMode === 'grid' && (
            <div className="space-y-4">
              {(hasGroups ? groups : [{ name: '', companies: visibleCompanies }]).map((group) => {
                const expanded = isGroupExpanded(group.name);
                let indexOffset = 0;
                for (const g of groups) {
                  if (g.name === group.name) break;
                  indexOffset += g.companies.length;
                }
                return (
                  <div key={group.name || '__ungrouped'}>
                    {group.name && <GroupHeader name={group.name} count={group.companies.length} isExpanded={expanded} onToggle={() => toggleGroup(group.name)} />}
                    {expanded && (
                      <div className={cn(`grid grid-cols-1 gap-4`, gridColumns === 2 ? 'md:grid-cols-2' : gridColumns === 3 ? 'md:grid-cols-2 lg:grid-cols-3' : gridColumns === 4 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : gridColumns === 5 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6', group.name && 'mt-2 ml-2 border-l-2 border-primary/20 pl-3')}>
                        {group.companies.map((company, i) => (
                          <CompanyCardWithContext key={company.id} company={company} index={indexOffset + i} isSelected={selectedIds.has(company.id)} isHighlighted={selectedIndex === indexOffset + i} selectionMode={selectionMode}
                            contactCount={companyMetrics.contactCountMap.get(company.id) || 0} lastInteractionDays={companyMetrics.lastInteractionMap.get(company.id) ?? null} compact={gridColumns >= 5}
                            onSelect={onSelect} onEdit={onSetEditingCompany} onDelete={onSetDeletingCompany} onUpdate={updateCompany} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'list' && (
            <div className="space-y-2">
              {visibleCompanies.map((company) => (
                <CompanyListItem key={company.id} company={company} contactCount={companyMetrics.contactCountMap.get(company.id) || 0} lastInteractionDays={companyMetrics.lastInteractionMap.get(company.id) ?? null} isSelected={selectedIds.has(company.id)} selectionMode={selectionMode} onSelect={onSelect} />
              ))}
            </div>
          )}

          {viewMode === 'table' && (
            <CompaniesTableView companies={visibleCompanies} selectionMode={selectionMode} selectedIds={selectedIds} onSelect={onSelect} contactCountMap={companyMetrics.contactCountMap} lastInteractionMap={companyMetrics.lastInteractionMap} sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleTableSort} />
          )}

          {filteredAndSortedCompanies.length === 0 && !loading && (
            isSearching || Object.keys(activeFilters).length > 0
              ? <SearchEmptyState searchTerm={localSearch || 'filtros ativos'} onClearSearch={() => { clearSearch(); onFiltersChange({}); }} entityName="empresas" />
              : <EmptyState illustration="companies" title="Organize suas contas corporativas" description="Cadastre empresas para vincular contatos e ter uma visão completa dos seus relacionamentos B2B."
                  actions={[{ label: 'Cadastrar Empresa', onClick: () => onSetIsFormOpen(true), icon: Plus }]}
                  tips={['Adicione dados como segmento e porte para análises mais precisas', 'Vincule contatos às empresas para contexto nas interações', 'Use tags para agrupar empresas por oportunidade ou projeto']} />
          )}

          {hasMore && <div ref={sentinelRef} className="flex items-center justify-center py-6 text-sm text-muted-foreground animate-pulse">Carregando mais {Math.min(RENDER_BATCH, filteredAndSortedCompanies.length - visibleCount)} empresas...</div>}
        </>
      )}

      <BulkActionsBar selectedIds={Array.from(selectedIds)} totalCount={filteredAndSortedCompanies.length} entityType="companies" onSelectAll={onSelectAll} onClearSelection={() => onSelect('__clear__', false)} onDelete={onBulkDelete} onAddTag={onBulkAddTag} />
    </div>
  );
}
