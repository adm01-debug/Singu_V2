import { useState, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCustomFields, useCustomFieldValues, EntityType } from '@/hooks/useCustomFields';

interface Props {
  entityType: EntityType;
  entityId: string;
}

export function CustomFieldsDisplay({ entityType, entityId }: Props) {
  const { fields, isLoading: fieldsLoading } = useCustomFields(entityType);
  const { values, isLoading: valuesLoading, saveValue } = useCustomFieldValues(entityType, entityId);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const map: Record<string, string> = {};
    for (const v of values) {
      map[v.custom_field_id] = v.value || '';
    }
    setLocalValues(map);
  }, [values]);

  if (fieldsLoading || valuesLoading) return <Skeleton className="h-24 rounded-lg" />;
  if (fields.length === 0) return null;

  const handleBlur = (fieldId: string) => {
    const current = values.find(v => v.custom_field_id === fieldId);
    const newVal = localValues[fieldId] || '';
    if (current?.value !== newVal) {
      saveValue.mutate({ fieldId, value: newVal || null });
    }
  };

  const handleChange = (fieldId: string, val: string) => {
    setLocalValues(prev => ({ ...prev, [fieldId]: val }));
  };

  const handleSelectChange = (fieldId: string, val: string) => {
    setLocalValues(prev => ({ ...prev, [fieldId]: val }));
    saveValue.mutate({ fieldId, value: val });
  };

  const handleBoolChange = (fieldId: string, checked: boolean) => {
    const val = checked ? 'true' : 'false';
    setLocalValues(prev => ({ ...prev, [fieldId]: val }));
    saveValue.mutate({ fieldId, value: val });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Settings2 className="h-4 w-4 text-primary" />
          Campos Personalizados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map(field => {
            const val = localValues[field.id] || '';
            return (
              <div key={field.id}>
                <Label className="text-xs font-medium">{field.field_label}</Label>
                {field.field_type === 'select' ? (
                  <Select value={val} onValueChange={v => handleSelectChange(field.id, v)}>
                    <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {(field.field_options || []).map(opt => (
                        <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.field_type === 'boolean' ? (
                  <div className="mt-1.5">
                    <Switch checked={val === 'true'} onCheckedChange={c => handleBoolChange(field.id, c)} />
                  </div>
                ) : (
                  <Input
                    className="h-8 text-xs mt-1"
                    type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : field.field_type === 'url' ? 'url' : field.field_type === 'email' ? 'email' : 'text'}
                    value={val}
                    onChange={e => handleChange(field.id, e.target.value)}
                    onBlur={() => handleBlur(field.id)}
                    placeholder={`${field.field_label}...`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
