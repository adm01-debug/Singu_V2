import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ENTITIES, type EntityKey, type ReportFilter, type FilterOperator, type ReportAggregation, type AggregationFn } from '@/lib/reports/reportEngine';

const OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: 'igual a', neq: 'diferente de',
  gt: '>', gte: '>=', lt: '<', lte: '<=',
  contains: 'contém', starts_with: 'começa com',
  is_null: 'é vazio', is_not_null: 'não é vazio',
};

const AGG_LABELS: Record<AggregationFn, string> = {
  count: 'Contagem', sum: 'Soma', avg: 'Média', min: 'Mínimo', max: 'Máximo',
};

interface Props {
  entity: EntityKey;
  setEntity: (e: EntityKey) => void;
  selectedFields: string[];
  setSelectedFields: (f: string[]) => void;
  filters: ReportFilter[];
  setFilters: (f: ReportFilter[]) => void;
  groupBy: string | undefined;
  setGroupBy: (g: string | undefined) => void;
  aggregations: ReportAggregation[];
  setAggregations: (a: ReportAggregation[]) => void;
}

export function ReportConfigPanel({
  entity, setEntity,
  selectedFields, setSelectedFields,
  filters, setFilters,
  groupBy, setGroupBy,
  aggregations, setAggregations,
}: Props) {
  const def = ENTITIES[entity];

  const toggleField = (key: string) => {
    setSelectedFields(
      selectedFields.includes(key)
        ? selectedFields.filter(f => f !== key)
        : [...selectedFields, key],
    );
  };

  const addFilter = () => {
    setFilters([...filters, { fieldKey: def.fields[0].key, operator: 'eq', value: '' }]);
  };

  const updateFilter = (idx: number, patch: Partial<ReportFilter>) => {
    setFilters(filters.map((f, i) => i === idx ? { ...f, ...patch } : f));
  };

  const removeFilter = (idx: number) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const addAggregation = () => {
    setAggregations([...aggregations, { fn: 'count', fieldKey: def.fields[0].key }]);
  };

  return (
    <div className="space-y-4">
      {/* Entity */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">1. Fonte de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={entity} onValueChange={(v) => { setEntity(v as EntityKey); setSelectedFields([]); setFilters([]); setGroupBy(undefined); setAggregations([]); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.values(ENTITIES).map(e => (
                <SelectItem key={e.key} value={e.key} className="text-xs">{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Fields */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">2. Colunas ({selectedFields.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {def.fields.map(f => (
              <Badge
                key={f.key}
                variant={selectedFields.includes(f.key) ? 'default' : 'outline'}
                className="cursor-pointer text-xs"
                onClick={() => toggleField(f.key)}
              >
                {f.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">3. Filtros ({filters.length})</CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addFilter}>
            <Plus className="h-3 w-3 mr-1" /> Filtro
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {filters.map((f, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <Select value={f.fieldKey} onValueChange={(v) => updateFilter(idx, { fieldKey: v })}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {def.fields.map(field => (
                    <SelectItem key={field.key} value={field.key} className="text-xs">{field.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={f.operator} onValueChange={(v) => updateFilter(idx, { operator: v as FilterOperator })}>
                <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(OPERATOR_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {f.operator !== 'is_null' && f.operator !== 'is_not_null' && (
                <Input
                  className="h-7 text-xs w-32"
                  value={String(f.value ?? '')}
                  onChange={(e) => updateFilter(idx, { value: e.target.value })}
                  placeholder="valor"
                />
              )}
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeFilter(idx)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Group By */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">4. Agrupar por (opcional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={groupBy ?? '__none__'} onValueChange={(v) => setGroupBy(v === '__none__' ? undefined : v)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs">— Sem agrupamento —</SelectItem>
              {def.fields.map(f => (
                <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Aggregations */}
      <Card>
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm">5. Métricas ({aggregations.length})</CardTitle>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addAggregation}>
            <Plus className="h-3 w-3 mr-1" /> Métrica
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {aggregations.map((a, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <Select value={a.fn} onValueChange={(v) => setAggregations(aggregations.map((x, i) => i === idx ? { ...x, fn: v as AggregationFn } : x))}>
                <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(AGG_LABELS).map(([k, label]) => (
                    <SelectItem key={k} value={k} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={a.fieldKey} onValueChange={(v) => setAggregations(aggregations.map((x, i) => i === idx ? { ...x, fieldKey: v } : x))}>
                <SelectTrigger className="h-7 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {def.fields.map(f => (
                    <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setAggregations(aggregations.filter((_, i) => i !== idx))}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
