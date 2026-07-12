import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Building2, User, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EntityType } from '@/hooks/useEntityRelationships';

interface EntityPickerProps {
  label: string;
  entityType: EntityType;
  value: { id: string; label: string } | null;
  onChange: (v: { id: string; label: string } | null) => void;
  disabledIds?: string[];
}

function useEntitySearch(entityType: EntityType, term: string) {
  return useQuery({
    queryKey: ['entity-picker', entityType, term],
    staleTime: 30_000,
    queryFn: async () => {
      const table = entityType === 'company' ? 'companies' : 'contacts';
      const select = entityType === 'company' ? 'id, nome_crm, nome_fantasia' : 'id, first_name, last_name, email';
      const cols = entityType === 'company' ? ['nome_crm', 'nome_fantasia'] : ['first_name', 'last_name', 'email'];
      const { data } = await queryExternalData<Record<string, unknown>>({
        table,
        select,
        search: term.trim().length >= 2 ? { term: term.trim(), columns: cols } : undefined,
        range: { from: 0, to: 24 },
      });
      return (data ?? []).map((r) => ({
        id: String(r.id),
        label:
          entityType === 'company'
            ? String(r.nome_crm || r.nome_fantasia || 'Sem nome')
            : `${String(r.first_name || '')} ${String(r.last_name || '')}`.trim() || String(r.email || 'Sem nome'),
      }));
    },
  });
}

export function EntityPicker({ label, entityType, value, onChange, disabledIds = [] }: EntityPickerProps) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');
  const { data = [], isLoading } = useEntitySearch(entityType, term);
  const Icon = entityType === 'company' ? Building2 : User;

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between">
            <span className="flex items-center gap-2 truncate">
              <Icon className="h-4 w-4 text-muted-foreground" />
              {value?.label ?? `Buscar ${entityType === 'company' ? 'empresa' : 'pessoa'}...`}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[--radix-popover-trigger-width]" align="start">
          <Command shouldFilter={false}>
            <div className="p-2 border-b">
              <Input
                autoFocus
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Digite ao menos 2 caracteres"
              />
            </div>
            <CommandList>
              {isLoading && <div className="p-3 text-sm text-muted-foreground">Buscando...</div>}
              {!isLoading && data.length === 0 && <CommandEmpty>Nenhum resultado</CommandEmpty>}
              <CommandGroup>
                {data.map((item) => {
                  const disabled = disabledIds.includes(item.id);
                  const selected = value?.id === item.id;
                  return (
                    <CommandItem
                      key={item.id}
                      disabled={disabled}
                      onSelect={() => {
                        onChange({ id: item.id, label: item.label });
                        setOpen(false);
                      }}
                    >
                      <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}