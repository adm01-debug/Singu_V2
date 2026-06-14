import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Filter, 
  X, 
  ChevronDown, 
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
  icon?: React.ElementType;
  color?: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

export interface SortOption {
  value: string;
  label: string;
}

export interface SortCriteria {
  column: string;
  order: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  filters: FilterConfig[];
  sortOptions: SortOption[];
  activeFilters: Record<string, string[]>;
  onFiltersChange: (filters: Record<string, string[]>) => void;
  sortBy: string; // legacy
  sortOrder: 'asc' | 'desc'; // legacy
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void; // legacy
  multiSort?: SortCriteria[];
  onMultiSortChange?: (criteria: SortCriteria[]) => void;
}

export function AdvancedFilters({
  filters,
  sortOptions,
  activeFilters,
  onFiltersChange,
  sortBy,
  sortOrder,
  onSortChange,
  multiSort = [],
  onMultiSortChange,
}: AdvancedFiltersProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const [sortOpen, setSortOpen] = useState(false);

  const activeFilterCount = Object.values(activeFilters).reduce(
    (acc, arr) => acc + arr.length,
    0
  );

  const toggleFilter = (key: string, value: string, multiple?: boolean) => {
    const current = activeFilters[key] || [];
    let newValues: string[];

    if (multiple) {
      newValues = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
    } else {
      newValues = current.includes(value) ? [] : [value];
    }

    onFiltersChange({
      ...activeFilters,
      [key]: newValues,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const removeFilter = (key: string, value: string) => {
    const current = activeFilters[key] || [];
    onFiltersChange({
      ...activeFilters,
      [key]: current.filter(v => v !== value),
    });
  };

  const getFilterLabel = (key: string, value: string): string => {
    const filter = filters.find(f => f.key === key);
    const option = filter?.options.find(o => o.value === value);
    return option?.label || value;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1 md:flex-wrap md:overflow-visible md:pb-0">
        {/* Filter Dropdowns */}
        {filters.map(filter => {
          const selectedValues = activeFilters[filter.key] || [];
          const hasSelection = selectedValues.length > 0;

          return (
            <Popover 
              key={filter.key} 
              open={openFilter === filter.key} 
              onOpenChange={(open) => setOpenFilter(open ? filter.key : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant={hasSelection ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "gap-1.5 h-9 shrink-0 whitespace-nowrap",
                    hasSelection && "pr-1.5"
                  )}
                >
                  <Filter className="w-3.5 h-3.5" />
                  {filter.label}
                  {hasSelection && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 rounded-full px-1.5 py-0 text-xs font-medium bg-primary-foreground/20 text-primary-foreground"
                    >
                      {selectedValues.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="start">
                <Command>
                  <CommandInput placeholder={`Buscar ${filter.label.toLowerCase()}...`} />
                  <CommandList>
                    <CommandEmpty>Nenhum resultado.</CommandEmpty>
                    <CommandGroup>
                      {filter.options.map(option => {
                        const isSelected = selectedValues.includes(option.value);
                        const Icon = option.icon;
                        
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => toggleFilter(filter.key, option.value, filter.multiple)}
                            className="cursor-pointer"
                          >
                            <div className={cn(
                              "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                              isSelected 
                                ? "bg-primary border-primary text-primary-foreground" 
                                : "border-muted-foreground/30"
                            )}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            {Icon && <Icon className="w-4 h-4 mr-2 text-muted-foreground" />}
                            <span>{option.label}</span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    {selectedValues.length > 0 && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => onFiltersChange({ ...activeFilters, [filter.key]: [] })}
                            className="justify-center text-center cursor-pointer text-muted-foreground"
                          >
                            Limpar filtro
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          );
        })}

        {/* Sort Dropdown */}
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 shrink-0 whitespace-nowrap">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Ordenar
              {multiSort.length > 0 && (
                <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-xs font-medium">
                  {multiSort.length}
                </Badge>
              )}
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandList>
                <CommandGroup heading="Ordenação Múltipla">
                  {sortOptions.map(option => {
                    const criteriaIndex = multiSort.findIndex(s => s.column === option.value);
                    const isSorted = criteriaIndex !== -1;
                    const order = isSorted ? multiSort[criteriaIndex].order : null;

                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => {
                          if (!onMultiSortChange) {
                            // Legacy fallback
                            if (sortBy === option.value) {
                              onSortChange(option.value, sortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              onSortChange(option.value, 'asc');
                            }
                            setSortOpen(false);
                            return;
                          }

                          const newSort = [...multiSort];
                          if (isSorted) {
                            if (order === 'asc') {
                              newSort[criteriaIndex] = { ...newSort[criteriaIndex], order: 'desc' };
                            } else {
                              newSort.splice(criteriaIndex, 1);
                            }
                          } else {
                            newSort.push({ column: option.value, order: 'asc' });
                          }
                          onMultiSortChange(newSort);
                        }}
                        className="cursor-pointer justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border",
                            isSorted ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                          )}>
                            {isSorted && <span className="text-[10px] font-bold">{criteriaIndex + 1}</span>}
                          </div>
                          <span>{option.label}</span>
                        </div>
                        {isSorted && (
                          order === 'asc' 
                            ? <ArrowUp className="w-4 h-4" />
                            : <ArrowDown className="w-4 h-4" />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {multiSort.length > 0 && onMultiSortChange && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => onMultiSortChange([])}
                        className="justify-center text-center cursor-pointer text-muted-foreground"
                      >
                        Limpar ordenação
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Limpar tudo
          </Button>
        )}
      </div>

      {/* Active Filters Tags */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 flex-wrap"
          >
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {Object.entries(activeFilters).map(([key, values]) =>
              values.map(value => (
                <motion.div
                  key={`${key}-${value}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Badge
                    variant="secondary"
                    className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
                    onClick={() => removeFilter(key, value)}
                  >
                    {getFilterLabel(key, value)}
                    <X className="w-3 h-3" />
                  </Badge>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
