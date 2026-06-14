import { useState } from 'react';
import { Filter, Plus, X, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContactSegmentation, SegmentFilter } from '@/hooks/useContactSegmentation';

const OPERATOR_LABELS: Record<string, string> = {
  eq: 'igual a', neq: 'diferente de', gt: 'maior que', lt: 'menor que',
  contains: 'contém', in: 'está em', is_null: 'está vazio', is_not_null: 'não está vazio',
};

interface Props {
  onSegmentChange?: (contactIds: string[]) => void;
}

export function SegmentBuilderPanel({ onSegmentChange }: Props) {
  const { segment, addFilter, removeFilter, setLogic, clearFilters, filteredContacts, totalContacts, availableFields } = useContactSegmentation();
  const [newField, setNewField] = useState('');
  const [newOp, setNewOp] = useState<string>('eq');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newField) return;
    addFilter({ field: newField, operator: newOp as SegmentFilter['operator'], value: newValue });
    setNewField(''); setNewValue('');
    onSegmentChange?.(filteredContacts.map(c => c.id));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Segmentação de Contatos
          </span>
          <Badge variant="secondary" className="text-xs">
            <Users className="h-3 w-3 mr-1" /> {filteredContacts.length}/{totalContacts}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Logic toggle */}
        <div className="flex items-center gap-2">
          <Button variant={segment.logic === 'and' ? 'default' : 'outline'} size="sm" className="h-6 text-[10px]" onClick={() => setLogic('and')}>
            E (AND)
          </Button>
          <Button variant={segment.logic === 'or' ? 'default' : 'outline'} size="sm" className="h-6 text-[10px]" onClick={() => setLogic('or')}>
            OU (OR)
          </Button>
          {segment.filters.length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] ml-auto" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>

        {/* Active filters */}
        {segment.filters.map((f, i) => {
          const field = availableFields.find(af => af.key === f.field);
          return (
            <div key={i} className="flex items-center gap-1.5 bg-muted/30 rounded px-2 py-1.5">
              <Badge variant="outline" className="text-[10px] h-4">{field?.label || f.field}</Badge>
              <span className="text-[10px] text-muted-foreground">{OPERATOR_LABELS[f.operator]}</span>
              {!['is_null', 'is_not_null'].includes(f.operator) && (
                <Badge className="text-[10px] h-4">{f.value}</Badge>
              )}
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 ml-auto" onClick={() => removeFilter(i)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          );
        })}

        {/* Add filter */}
        <div className="flex gap-1.5 items-end">
          <Select value={newField} onValueChange={setNewField}>
            <SelectTrigger className="h-7 text-[10px] flex-1"><SelectValue placeholder="Campo" /></SelectTrigger>
            <SelectContent>
              {availableFields.map(f => <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={newOp} onValueChange={setNewOp}>
            <SelectTrigger className="h-7 text-[10px] w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(OPERATOR_LABELS).map(([k, v]) => <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>)}
            </SelectContent>
          </Select>
          {!['is_null', 'is_not_null'].includes(newOp) && (
            <Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Valor" className="h-7 text-[10px] w-20" />
          )}
          <Button size="sm" className="h-7 w-7 p-0" onClick={handleAdd} disabled={!newField}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
