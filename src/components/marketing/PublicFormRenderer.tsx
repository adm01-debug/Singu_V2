import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FormField } from '@/hooks/useForms';

interface Props {
  fields: FormField[];
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void;
  submitLabel?: string;
}

export function PublicFormRenderer({ fields, onSubmit, submitLabel = 'Enviar' }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={f.key} className="text-sm font-medium">
            {f.label} {f.required && <span className="text-destructive">*</span>}
          </Label>
          {f.type === 'textarea' ? (
            <Textarea
              id={f.key}
              required={f.required}
              placeholder={f.placeholder}
              value={(values[f.key] as string) ?? ''}
              onChange={(e) => set(f.key, e.target.value)}
              maxLength={2000}
            />
          ) : f.type === 'select' ? (
            <Select value={(values[f.key] as string) ?? ''} onValueChange={(v) => set(f.key, v)}>
              <SelectTrigger><SelectValue placeholder={f.placeholder ?? 'Selecione...'} /></SelectTrigger>
              <SelectContent>
                {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : f.type === 'checkbox' ? (
            <Checkbox
              id={f.key}
              checked={!!values[f.key]}
              onCheckedChange={(v) => set(f.key, !!v)}
            />
          ) : (
            <Input
              id={f.key}
              type={f.type === 'phone' ? 'tel' : f.type}
              required={f.required}
              placeholder={f.placeholder}
              value={(values[f.key] as string | number | undefined) ?? ''}
              onChange={(e) => set(f.key, e.target.value)}
              maxLength={500}
            />
          )}
        </div>
      ))}
      <Button type="submit" variant="default" className="w-full" disabled={loading}>
        {loading ? 'Enviando...' : submitLabel}
      </Button>
    </form>
  );
}
