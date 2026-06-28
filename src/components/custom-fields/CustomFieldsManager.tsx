import { useState } from 'react';
import { Plus, Trash2, GripVertical, Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useCustomFields, EntityType, FieldType } from '@/hooks/useCustomFields';

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto',
  number: 'Número',
  date: 'Data',
  select: 'Seleção',
  boolean: 'Sim/Não',
  url: 'URL',
  email: 'Email',
  phone: 'Telefone',
};

interface Props {
  entityType: EntityType;
}

export function CustomFieldsManager({ entityType }: Props) {
  const { fields, createField, deleteField } = useCustomFields(entityType);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [options, setOptions] = useState('');

  const handleCreate = () => {
    if (!label.trim()) return;
    const fieldName = label.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    createField.mutate({
      entity_type: entityType,
      field_name: fieldName,
      field_label: label.trim(),
      field_type: type,
      field_options: type === 'select' ? options.split(',').map(o => o.trim()).filter(Boolean) : [],
      is_required: required,
      display_order: fields.length,
    });
    setLabel('');
    setType('text');
    setRequired(false);
    setOptions('');
    setShowForm(false);
  };

  const entityLabel = entityType === 'contact' ? 'Contato' : entityType === 'company' ? 'Empresa' : 'Deal';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Campos Personalizados — {entityLabel}
          </span>
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="h-7 text-xs">
            <Plus className="h-3 w-3 mr-1" /> Novo Campo
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Nome do Campo</Label>
                <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex: CPF, Setor..." className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={type} onValueChange={v => setType(v as FieldType)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {type === 'select' && (
              <div>
                <Label className="text-xs">Opções (separadas por vírgula)</Label>
                <Input value={options} onChange={e => setOptions(e.target.value)} placeholder="Opção 1, Opção 2, Opção 3" className="h-8 text-xs" />
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch checked={required} onCheckedChange={setRequired} id="cf-required" />
                <Label htmlFor="cf-required" className="text-xs">Obrigatório</Label>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-xs">Cancelar</Button>
                <Button size="sm" onClick={handleCreate} disabled={!label.trim() || createField.isPending} className="h-7 text-xs">Criar</Button>
              </div>
            </div>
          </div>
        )}

        {fields.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum campo personalizado criado.</p>
        )}

        {fields.map(field => (
          <div key={field.id} className="flex items-center justify-between border rounded-md px-3 py-2">
            <div className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span className="text-xs font-medium">{field.field_label}</span>
              <Badge variant="secondary" className="text-[10px] h-4">{FIELD_TYPE_LABELS[field.field_type as FieldType]}</Badge>
              {field.is_required && <Badge variant="destructive" className="text-[10px] h-4">Obrigatório</Badge>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive"
              onClick={() => deleteField.mutate(field.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
