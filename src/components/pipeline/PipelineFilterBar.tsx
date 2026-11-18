import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EMPTY_PIPELINE_FILTERS, countActiveFilters, type PipelineFilters } from './pipelineFilters';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  filters: PipelineFilters;
  onFilterChange: (filters: PipelineFilters) => void;
}

export function PipelineFilterBar({ search, onSearchChange, filters, onFilterChange }: Props) {
  const activeCount = countActiveFilters(filters);

  const toggle = (key: keyof PipelineFilters) => {
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar deals..."
          className="pl-9 h-9"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filtros
            {activeCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">{activeCount}</Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={filters.altaProbabilidade}
            onCheckedChange={() => toggle('altaProbabilidade')}
          >
            Alta Probabilidade ({'>'}70%)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.ticketAlto}
            onCheckedChange={() => toggle('ticketAlto')}
          >
            Tickets Altos ({'>'} R$ 10k)
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={filters.fechamentoNoMes}
            onCheckedChange={() => toggle('fechamentoNoMes')}
          >
            Deals do Mês
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start font-normal px-2 text-xs"
            disabled={activeCount === 0}
            onClick={() => onFilterChange(EMPTY_PIPELINE_FILTERS)}
          >
            Limpar filtros
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
