import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";
import { useAuth } from '@/hooks/useAuth';

export interface SavedFilter {
  id: string;
  name: string;
  type: 'contacts' | 'companies' | 'interactions';
  filters: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
  usageCount: number;
}

const SAVED_FILTERS_KEY = 'relateiq_saved_filters';

export function useSavedFilters(type: 'contacts' | 'companies' | 'interactions') {
  const { user } = useAuth();
  const effectiveKey = user?.id ? `${SAVED_FILTERS_KEY}-${user.id}` : SAVED_FILTERS_KEY;
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [activeFilter, setActiveFilter] = useState<SavedFilter | null>(null);

  // Load filters from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(effectiveKey);
      if (stored) {
        const allFilters: SavedFilter[] = JSON.parse(stored);
        const typeFilters = allFilters.filter(f => f.type === type);
        setFilters(typeFilters);

        // Auto-apply default filter
        const defaultFilter = typeFilters.find(f => f.isDefault);
        if (defaultFilter) {
          setActiveFilter(defaultFilter);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load saved filters:', { error: msg });
    }
  }, [type, effectiveKey]);

  // Save all filters to localStorage
  const saveToStorage = useCallback((updatedFilters: SavedFilter[]) => {
    try {
      const stored = localStorage.getItem(effectiveKey);
      const allFilters: SavedFilter[] = stored ? JSON.parse(stored) : [];

      // Remove old filters of this type and add updated ones
      const otherFilters = allFilters.filter(f => f.type !== type);
      const newAllFilters = [...otherFilters, ...updatedFilters];

      localStorage.setItem(effectiveKey, JSON.stringify(newAllFilters));
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to save filters:', { error: msg });
    }
  }, [type, effectiveKey]);

  // Create a new saved filter
  const saveFilter = useCallback((name: string, filterConfig: Record<string, unknown>) => {
    const newFilter: SavedFilter = {
      id: crypto.randomUUID(),
      name,
      type,
      filters: filterConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      usageCount: 0,
    };

    const updatedFilters = [...filters, newFilter];
    setFilters(updatedFilters);
    saveToStorage(updatedFilters);
    
    toast.success('Filtro salvo', {
      description: `"${name}" foi salvo com sucesso.`,
    });

    return newFilter;
  }, [filters, type, saveToStorage]);

  // Update an existing filter
  const updateFilter = useCallback((id: string, updates: Partial<Omit<SavedFilter, 'id' | 'type' | 'createdAt'>>) => {
    const updatedFilters = filters.map(f => 
      f.id === id 
        ? { ...f, ...updates, updatedAt: new Date().toISOString() }
        : f
    );
    
    setFilters(updatedFilters);
    saveToStorage(updatedFilters);
    
    toast.success('Filtro atualizado');
  }, [filters, saveToStorage]);

  // Delete a filter
  const deleteFilter = useCallback((id: string) => {
    const filter = filters.find(f => f.id === id);
    const updatedFilters = filters.filter(f => f.id !== id);
    
    setFilters(updatedFilters);
    saveToStorage(updatedFilters);
    
    if (activeFilter?.id === id) {
      setActiveFilter(null);
    }
    
    toast.success('Filtro excluído', {
      description: filter ? `"${filter.name}" foi removido.` : undefined,
    });
  }, [filters, activeFilter, saveToStorage]);

  // Apply a filter
  const applyFilter = useCallback((filter: SavedFilter) => {
    setActiveFilter(filter);
    
    // Increment usage count
    const updatedFilters = filters.map(f => 
      f.id === filter.id 
        ? { ...f, usageCount: f.usageCount + 1, updatedAt: new Date().toISOString() }
        : f
    );
    setFilters(updatedFilters);
    saveToStorage(updatedFilters);
    
    return filter.filters;
  }, [filters, saveToStorage]);

  // Clear active filter
  const clearActiveFilter = useCallback(() => {
    setActiveFilter(null);
  }, []);

  // Set a filter as default
  const setDefaultFilter = useCallback((id: string | null) => {
    const updatedFilters = filters.map(f => ({
      ...f,
      isDefault: f.id === id,
      updatedAt: f.id === id ? new Date().toISOString() : f.updatedAt,
    }));
    
    setFilters(updatedFilters);
    saveToStorage(updatedFilters);
    
    const filter = filters.find(f => f.id === id);
    toast.success(
      id 
        ? `"${filter?.name}" definido como padrão`
        : 'Filtro padrão removido'
    );
  }, [filters, saveToStorage]);

  // Rename a filter
  const renameFilter = useCallback((id: string, newName: string) => {
    updateFilter(id, { name: newName });
    
    toast.success('Filtro renomeado', {
      description: `Novo nome: "${newName}"`,
    });
  }, [updateFilter]);

  // Duplicate a filter
  const duplicateFilter = useCallback((id: string) => {
    const original = filters.find(f => f.id === id);
    if (!original) return null;

    const duplicate: SavedFilter = {
      ...original,
      id: crypto.randomUUID(),
      name: `${original.name} (cópia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      usageCount: 0,
    };

    const updatedFilters = [...filters, duplicate];
    setFilters(updatedFilters);
    saveToStorage(updatedFilters);
    
    toast.success('Filtro duplicado', {
      description: `"${duplicate.name}" criado.`,
    });

    return duplicate;
  }, [filters, saveToStorage]);

  // Get most used filters
  const getMostUsedFilters = useCallback((limit = 5) => {
    return [...filters]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }, [filters]);

  // Get recent filters
  const getRecentFilters = useCallback((limit = 5) => {
    return [...filters]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, limit);
  }, [filters]);

  return {
    filters,
    activeFilter,
    saveFilter,
    updateFilter,
    deleteFilter,
    applyFilter,
    clearActiveFilter,
    setDefaultFilter,
    renameFilter,
    duplicateFilter,
    getMostUsedFilters,
    getRecentFilters,
  };
}

export default useSavedFilters;
