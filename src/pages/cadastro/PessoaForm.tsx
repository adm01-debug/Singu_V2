import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { insertExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';
import { Loader2 } from 'lucide-react';
import { EntityPicker } from './EntityPicker';

const schema = z.object({
  first_name: z.string().trim().min(1, 'Informe o nome').max(100),
  last_name: z.string().trim().min(1, 'Informe o sobrenome').max(100),
  email: z.string().trim().email('E-mail inválido').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  cargo: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;
const empty: FormValues = { first_name: '', last_name: '', email: '', phone: '', cargo: '', notes: '' };

interface Props { onCreated?: (id: string, label: string) => void }

export function PessoaForm({ onCreated }: Props) {
  const { user } = useAuth();
  const [values, setValues] = useState<FormValues>(empty);
  const [company, setCompany] = useState<{ id: string; label: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormValues>(k: K, v: FormValues[K]) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const iss of parsed.error.issues) map[iss.path.join('.')] = iss.message;
      setErrors(map);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = Object.fromEntries(
        Object.entries(parsed.data).filter(([, v]) => v !== '' && v != null)
      );
      if (company) payload.company_id = company.id;
      const { data, error } = await insertExternalData<{ id: string; first_name?: string; last_name?: string }>(
        'contacts',
        { ...payload, user_id: user?.id }
      );
      if (error) throw error;
      if (!data?.id) throw new Error('Resposta sem ID');
      const label = `${values.first_name} ${values.last_name}`.trim();
      toast.success('Pessoa cadastrada');
      onCreated?.(data.id, label);
      setValues(empty);
      setCompany(null);
    } catch (err) {
      toast.error(`Falha ao cadastrar pessoa: ${parseApiError(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome *" error={errors.first_name}>
          <Input value={values.first_name} onChange={(e) => set('first_name', e.target.value)} maxLength={100} />
        </Field>
        <Field label="Sobrenome *" error={errors.last_name}>
          <Input value={values.last_name} onChange={(e) => set('last_name', e.target.value)} maxLength={100} />
        </Field>
        <Field label="E-mail" error={errors.email}>
          <Input type="email" value={values.email ?? ''} onChange={(e) => set('email', e.target.value)} maxLength={255} />
        </Field>
        <Field label="Telefone" error={errors.phone}>
          <Input value={values.phone ?? ''} onChange={(e) => set('phone', e.target.value)} maxLength={30} />
        </Field>
        <Field label="Cargo" error={errors.cargo}>
          <Input value={values.cargo ?? ''} onChange={(e) => set('cargo', e.target.value)} maxLength={120} />
        </Field>
        <EntityPicker label="Empresa vinculada (opcional)" entityType="company" value={company} onChange={setCompany} />
      </div>
      <Field label="Observações" error={errors.notes}>
        <Textarea rows={3} value={values.notes ?? ''} onChange={(e) => set('notes', e.target.value)} maxLength={2000} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cadastrar pessoa
        </Button>
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}