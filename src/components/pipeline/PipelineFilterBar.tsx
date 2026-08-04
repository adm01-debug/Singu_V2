import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  onFilterChange: (filters: Record<string, unknown>) => void;
}

export function PipelineFilterBar({ search, onSearchChange, onFilterChange }: Props) {
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
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Alta Probabilidade ({'>'}70%)</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Tickets Altos ({'>'} R$ 10k)</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Deals do Mês</DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <Button variant="ghost" size="sm" className="w-full justify-start font-normal px-2 text-xs">
            Limpar filtros
          </Button>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
