import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import type { FormField } from '@/hooks/useForms';

interface Props {
  fields: FormField[];
  onChange: (fields: FormField[]) => void;
}

const TYPES: { value: FormField['type']; label: string }[] = [
  { value: 'text', label: 'Texto' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefone' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Seleção' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'number', label: 'Número' },
];

export function FormBuilder({ fields, onChange }: Props) {
  const [newKey, setNewKey] = useState('');

  const add = () => {
    const k = newKey.trim() || `field_${fields.length + 1}`;
    onChange([...fields, { key: k, label: k, type: 'text', required: false }]);
    setNewKey('');
  };

  const update = (i: number, patch: Partial<FormField>) => {
    onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  };

  const remove = (i: number) => onChange(fields.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          placeholder="chave do campo (ex: nome, email)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase())}
          className="flex-1"
        />
        <Button onClick={add} variant="default" size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> Adicionar
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Nenhum campo. Adicione o primeiro acima.
        </p>
      )}

      {fields.map((f, i) => (
        <Card key={i} variant="outlined" className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Chave"
              value={f.key}
              onChange={(e) => update(i, { key: e.target.value })}
              className="w-32 text-xs"
            />
            <Input
              placeholder="Label"
              value={f.label}
              onChange={(e) => update(i, { label: e.target.value })}
              className="flex-1 text-sm"
            />
            <Select value={f.type} onValueChange={(v) => update(i, { type: v as FormField['type'] })}>
              <SelectTrigger className="w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="icon" aria-label="Remover" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(i)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-3 pl-6">
            <Label className="flex items-center gap-2 text-xs">
              <Switch checked={!!f.required} onCheckedChange={(v) => update(i, { required: v })} />
              Obrigatório
            </Label>
            <Input
              placeholder="Placeholder (opcional)"
              value={f.placeholder ?? ''}
              onChange={(e) => update(i, { placeholder: e.target.value })}
              className="flex-1 text-xs"
            />
          </div>
          {f.type === 'select' && (
            <Input
              placeholder="Opções separadas por vírgula"
              value={(f.options ?? []).join(', ')}
              onChange={(e) => update(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
              className="text-xs"
            />
          )}
        </Card>
      ))}
    </div>
  );
}
