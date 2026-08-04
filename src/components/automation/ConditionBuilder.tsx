import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AutomationCondition } from '@/hooks/useAutomationRules';

const FIELD_OPTIONS = [
  { value: 'relationship_score', label: 'Score de Relacionamento' },
  { value: 'sentiment', label: 'Sentimento' },
  { value: 'relationship_stage', label: 'Estágio' },
  { value: 'tags', label: 'Tags' },
  { value: 'interaction_count', label: 'Qtd. Interações' },
  { value: 'days_since_contact', label: 'Dias sem Contato' },
  { value: 'company_name', label: 'Empresa' },
];

const OPERATOR_OPTIONS = [
  { value: 'eq', label: 'Igual a' },
  { value: 'neq', label: 'Diferente de' },
  { value: 'gt', label: 'Maior que' },
  { value: 'lt', label: 'Menor que' },
  { value: 'gte', label: 'Maior ou igual' },
  { value: 'lte', label: 'Menor ou igual' },
  { value: 'contains', label: 'Contém' },
];

interface ConditionBuilderProps {
  conditions: AutomationCondition[];
  onChange: (conditions: AutomationCondition[]) => void;
}

export function ConditionBuilder({ conditions, onChange }: ConditionBuilderProps) {
  const addCondition = () => {
    onChange([...conditions, { field: 'relationship_score', operator: 'gt', value: '' }]);
  };

  const updateCondition = (index: number, updates: Partial<AutomationCondition>) => {
    onChange(conditions.map((c, i) => i === index ? { ...c, ...updates } : c));
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">🔍 Condições (opcional)</p>
        <Button variant="outline" size="sm" onClick={addCondition} className="text-xs gap-1">
          <Plus className="w-3 h-3" /> Condição
        </Button>
      </div>

      {conditions.length === 0 && (
        <p className="text-xs text-muted-foreground italic py-2">
          Sem condições — a ação será executada sempre que o trigger disparar.
        </p>
      )}

      {conditions.map((condition, i) => (
        <div key={i} className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/20">
          <Select value={condition.field} onValueChange={v => updateCondition(i, { field: v })}>
            <SelectTrigger className="w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.map(f => (
                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={condition.operator} onValueChange={v => updateCondition(i, { operator: v as AutomationCondition['operator'] })}>
            <SelectTrigger className="w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERATOR_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            className="flex-1 text-xs"
            placeholder="Valor..."
            value={String(condition.value)}
            onChange={e => updateCondition(i, { value: e.target.value })}
          />

          <Button variant="ghost" size="icon" aria-label="Remover" className="h-7 w-7 text-destructive" onClick={() => removeCondition(i)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}
