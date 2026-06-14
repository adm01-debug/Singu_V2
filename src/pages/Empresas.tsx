import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { sortArray } from '@/lib/sorting-utils';
import { hapticSuccess, hapticHeavy } from '@/lib/haptics';
import { useSuccessCelebration } from '@/hooks/useSuccessCelebration';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FloatingQuickActions } from '@/components/quick-actions/FloatingQuickActions';
import { Header } from '@/components/layout/Header';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CompanyForm } from '@/components/forms/CompanyForm';
import { useCompanies, type Company } from '@/hooks/useCompanies';
import { useContacts } from '@/hooks/useContacts';
import { useInteractions } from '@/hooks/useInteractions';
import { useCompanyFilterOptions } from '@/hooks/useCompanyFilterOptions';
import { useListNavigation, useKeyboardShortcutsEnhanced } from '@/hooks/useKeyboardShortcutsEnhanced';
import type { ViewMode, GridColumns } from '@/components/ui/view-mode-switcher';
import { EmpresasContent } from './empresas/EmpresasContent';
import { SavedViewsBar } from '@/components/views/SavedViewsBar';
import { useSavedViews } from '@/hooks/useSavedViews';
import { useActionToast } from '@/hooks/useActionToast';
import { useRestoreEntity } from '@/hooks/useRestoreEntity';

interface EmpresasViewState {
  localSearch: string;
  viewMode: ViewMode;
  gridColumns: GridColumns;
  activeFilters: Record<string, string[]>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  multiSort: Array<{ column: string, order: 'asc' | 'desc' }>;
}

const Empresas = () => {
  usePageTitle('Empresas');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { companies, loading, totalCount, searchTerm: activeSearch, setSearchTerm: triggerSearch, createCompany, updateCompany, deleteCompany } = useCompanies();
  const { destructive } = useActionToast();
  const { restore } = useRestoreEntity();

  const [secondaryReady, setSecondaryReady] = useState(false);
  useEffect(() => { if (!loading && companies.length > 0) { const t = setTimeout(() => setSecondaryReady(true), 800); return () => clearTimeout(t); } }, [loading, companies.length]);

  const { contacts } = useContacts(undefined, { enabled: secondaryReady });
  const { interactions } = useInteractions(undefined, undefined, { enabled: secondaryReady });
  const dynamicFilters = useCompanyFilterOptions({ enabled: secondaryReady });

  const companyMetrics = useMemo(() => {
    const contactCountMap = new Map<string, number>();
    const lastInteractionMap = new Map<string, number>();
    if (contacts.length > 0) for (const c of contacts) { if (c.company_id) contactCountMap.set(c.company_id, (contactCountMap.get(c.company_id) || 0) + 1); }
    if (interactions.length > 0) { const now = Date.now(); for (const i of interactions) { if (i.company_id) { const days = Math.floor((now - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24)); const current = lastInteractionMap.get(i.company_id); if (current === undefined || days < current) lastInteractionMap.set(i.company_id, days); } } }
    return { contactCountMap, lastInteractionMap };
  }, [contacts, interactions]);

  const [localSearch, setLocalSearch] = useState(() => searchParams.get('q') || '');
  const [viewMode, setViewMode] = useState<ViewMode>(() => (searchParams.get('view') as ViewMode) || 'grid');
  const [gridColumns, setGridColumns] = useState<GridColumns>(() => { const c = searchParams.get('cols'); return c ? (Number(c) as GridColumns) : 3; });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(() => { try { const f = searchParams.get('filters'); return f ? JSON.parse(decodeURIComponent(f)) : {}; } catch { return {}; } });
  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => (searchParams.get('order') as 'asc' | 'desc') || 'desc');
  const [multiSort, setMultiSort] = useState<Array<{ column: string, order: 'asc' | 'desc' }>>(() => {
    try {
      const ms = searchParams.get('msort');
      return ms ? JSON.parse(decodeURIComponent(ms)) : [{ column: sortBy, order: sortOrder }];
    } catch {
      return [{ column: sortBy, order: sortOrder }];
    }
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (localSearch) params.set('q', localSearch);
    if (viewMode !== 'grid') params.set('view', viewMode);
    if (Object.keys(activeFilters).length > 0) params.set('filters', encodeURIComponent(JSON.stringify(activeFilters)));
    if (multiSort.length > 0) {
      params.set('msort', encodeURIComponent(JSON.stringify(multiSort)));
    } else {
      if (sortBy !== 'updated_at') params.set('sort', sortBy);
      if (sortOrder !== 'desc') params.set('order', sortOrder);
    }
    if (gridColumns !== 3) params.set('cols', String(gridColumns));
    setSearchParams(params, { replace: true });
  }, [localSearch, viewMode, activeFilters, sortBy, sortOrder, gridColumns, multiSort, setSearchParams]);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const isSearching = localSearch.length > 0;
  useEffect(() => {
    if (debounceRef.current) { clearTimeout(debounceRef.current); }
    debounceRef.current = setTimeout(() => triggerSearch(localSearch), 400);
    return () => { if (debounceRef.current) { clearTimeout(debounceRef.current); } };
  }, [localSearch]);

  const clearSearch = useCallback(() => { setLocalSearch(''); triggerSearch(''); }, [triggerSearch]);

  const filteredAndSortedCompanies = useMemo(() => {
    const result = companies.filter(company => {
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        const companyValue = company[key as keyof Company];
         if (key === 'is_customer' || key === 'is_supplier' || key === 'is_carrier' || key === 'is_matriz') {
           if (!values.includes(String(companyValue ?? false))) { return false; }
           continue;
         }
         
         if (key === 'vak_dominant' || key === 'motivation_direction' || key === 'working_style') {
           if (!companyValue || !values.includes(String(companyValue))) return false;
           continue;
         }
        if (typeof companyValue === 'boolean') {
          if (!values.includes(String(companyValue))) { return false; }
          continue;
        }
        if (companyValue === null || companyValue === undefined || companyValue === '') return false;
        if (!values.includes(String(companyValue))) return false;
      }
      return true;
    });
    
    // Inject metrics into objects for sorting
    const enriched = result.map(c => ({
      ...c,
      _contact_count: companyMetrics.contactCountMap.get(c.id) || 0,
      _last_interaction_days: companyMetrics.lastInteractionMap.get(c.id) ?? 9999,
    }));

    return sortArray(enriched, multiSort as any, undefined, { 
      dateFields: ['updated_at', 'created_at', 'data_fundacao', 'situacao_rf_data'] as any[],
      numericFields: ['capital_social', 'lead_score', '_contact_count', '_last_interaction_days'] as any[]
    }) as unknown as Company[];
  }, [companies, activeFilters, multiSort, companyMetrics]);

  const { selectedIndex } = useListNavigation(filteredAndSortedCompanies as Array<{ id: string }>, { onOpen: (company) => navigate(`/empresas/${company.id}`), onSelect: () => {} });
  useKeyboardShortcutsEnhanced();
  const { celebrate } = useSuccessCelebration();

  const handleCreate = async (data: Parameters<typeof createCompany>[0]) => { setIsSubmitting(true); const result = await createCompany(data); setIsSubmitting(false); if (result) { setIsFormOpen(false); hapticSuccess(); if (companies.length === 0) celebrate('confetti'); } };
  const handleUpdate = async (data: Parameters<typeof updateCompany>[1]) => {
    if (!editingCompany) return;
    setIsSubmitting(true);
    const result = await updateCompany(editingCompany.id, data, editingCompany.version);
    setIsSubmitting(false);
    if (result) { setEditingCompany(null); }
  };
  const handleDelete = async () => {
    if (!deletingCompany) return;
    const cp = deletingCompany; setDeletingCompany(null); hapticHeavy();
    const snapshot = { ...cp } as Record<string, unknown>;
    const success = await deleteCompany(cp.id);
    if (success) {
      destructive({
        message: `${cp.name || 'Empresa'} excluída`,
        description: 'Clique em Desfazer para restaurar',
        onUndo: () => { void restore('companies', snapshot, [['companies']]); },
      });
    }
  };

  const handleSelect = (id: string, selected: boolean) => {
    if (id === '__clear__') { setSelectedIds(new Set()); return; }
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) { next.add(id); } else { next.delete(id); }
      return next;
    });
  };
  const handleSelectAll = () => { setSelectedIds(selectedIds.size === filteredAndSortedCompanies.length ? new Set() : new Set(filteredAndSortedCompanies.map(c => c.id))); };
  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) { await deleteCompany(id); }
    setSelectedIds(new Set());
    setSelectionMode(false);
    const plural = ids.length > 1 ? 's' : '';
    toast.success(`${ids.length} empresa${plural} excluída${plural}`);
  };
  const handleBulkAddTag = async (ids: string[], tag: string) => { for (const id of ids) { const company = companies.find(c => c.id === id); if (company) { const currentTags = company.tags || []; if (!currentTags.includes(tag)) await updateCompany(id, { tags: [...currentTags, tag] }); } } setSelectedIds(new Set()); toast.success(`Tag "${tag}" adicionada a ${ids.length} empresa${ids.length > 1 ? 's' : ''}`); };

  return (
    <AppLayout>
      <SEOHead title="Empresas" description="Gestão de empresas e organizações" />
       <Header title="Empresas" subtitle={filteredAndSortedCompanies.length === (activeSearch ? totalCount : companies.length) ? `${activeSearch ? totalCount : companies.length} empresas` : `${filteredAndSortedCompanies.length} de ${activeSearch ? totalCount : companies.length} empresas`} showAddButton addButtonLabel="Nova Empresa" onAddClick={() => setIsFormOpen(true)} />

      <div className="px-4 md:px-6 -mt-2 mb-3">
        <EmpresasSavedViews
          currentState={{ localSearch, viewMode, gridColumns, activeFilters, sortBy, sortOrder, multiSort }}
          onApply={(s) => {
            setLocalSearch(s.localSearch);
            setViewMode(s.viewMode);
            setGridColumns(s.gridColumns);
            setActiveFilters(s.activeFilters);
            setSortBy(s.sortBy);
            setSortOrder(s.sortOrder);
            if (s.multiSort) setMultiSort(s.multiSort);
          }}
        />
      </div>

      <EmpresasContent
        companies={companies} loading={loading} filteredAndSortedCompanies={filteredAndSortedCompanies}
        localSearch={localSearch} onSearchChange={setLocalSearch} clearSearch={clearSearch} isSearching={isSearching}
        viewMode={viewMode} onViewModeChange={setViewMode} gridColumns={gridColumns} onGridColumnsChange={setGridColumns}
        activeFilters={activeFilters} onFiltersChange={setActiveFilters}
        sortBy={sortBy} sortOrder={sortOrder} onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); setMultiSort([{ column: sb, order: so }]); }}
        multiSort={multiSort} onMultiSortChange={setMultiSort}
        dynamicFilters={dynamicFilters} selectionMode={selectionMode} selectedIds={selectedIds}
        onToggleSelectionMode={() => { setSelectionMode(!selectionMode); if (selectionMode) setSelectedIds(new Set()); }}
        onSelect={handleSelect} onSelectAll={handleSelectAll} onBulkDelete={handleBulkDelete} onBulkAddTag={handleBulkAddTag}
        onSetEditingCompany={setEditingCompany} onSetDeletingCompany={setDeletingCompany} onSetIsFormOpen={setIsFormOpen}
        updateCompany={updateCompany} companyMetrics={companyMetrics} selectedIndex={selectedIndex} triggerSearch={triggerSearch}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden"><CompanyForm onSubmit={handleCreate} onCancel={() => setIsFormOpen(false)} isSubmitting={isSubmitting} /></DialogContent>
      </Dialog>
      <Dialog open={!!editingCompany} onOpenChange={(open) => !open && setEditingCompany(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden"><CompanyForm company={editingCompany} onSubmit={handleUpdate} onCancel={() => setEditingCompany(null)} isSubmitting={isSubmitting} /></DialogContent>
      </Dialog>
      <AlertDialog open={!!deletingCompany} onOpenChange={(open) => !open && setDeletingCompany(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir empresa?</AlertDialogTitle><AlertDialogDescription>Tem certeza que deseja excluir <strong>{deletingCompany?.name}</strong>? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
      <FloatingQuickActions />
    </AppLayout>
  );
};

interface EmpresasSavedViewsProps {
  currentState: EmpresasViewState;
  onApply: (s: EmpresasViewState) => void;
}

function EmpresasSavedViews({ currentState, onApply }: EmpresasSavedViewsProps) {
  const sv = useSavedViews<EmpresasViewState>('empresas');
  return (
    <SavedViewsBar
      scope="empresas"
      views={sv.views}
      currentState={currentState}
      onSave={sv.save}
      onApply={(v) => { sv.apply(v); onApply(v.state); }}
      onRemove={sv.remove}
      onToggleFavorite={sv.toggleFavorite}
      onSetDefault={sv.setDefault}
      shareUrl={sv.shareUrl}
    />
  );
}

export default Empresas;
