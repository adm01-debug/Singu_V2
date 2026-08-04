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

const schema = z.object({
  nome_crm: z.string().trim().min(2, 'Informe o nome').max(200),
  nome_fantasia: z.string().trim().max(200).optional().or(z.literal('')),
  razao_social: z.string().trim().max(300).optional().or(z.literal('')),
  cnpj: z.string().trim().max(20).optional().or(z.literal('')),
  email: z.string().trim().email('E-mail inválido').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  state: z.string().trim().max(2).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});
type FormValues = z.infer<typeof schema>;
const empty: FormValues = { nome_crm: '', nome_fantasia: '', razao_social: '', cnpj: '', email: '', phone: '', city: '', state: '', notes: '' };

interface Props { onCreated?: (id: string, label: string) => void }

export function EmpresaForm({ onCreated }: Props) {
  const { user } = useAuth();
  const [values, setValues] = useState<FormValues>(empty);
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
      const payload = Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== '' && v != null));
      const { data, error } = await insertExternalData<{ id: string; nome_crm?: string }>(
        'companies',
        { ...payload, user_id: user?.id }
      );
      if (error) throw error;
      if (!data?.id) throw new Error('Resposta sem ID');
      toast.success('Empresa cadastrada');
      onCreated?.(data.id, data.nome_crm || values.nome_crm);
      setValues(empty);
    } catch (err) {
      toast.error(`Falha ao cadastrar empresa: ${parseApiError(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome (CRM) *" error={errors.nome_crm}>
          <Input value={values.nome_crm} onChange={(e) => set('nome_crm', e.target.value)} maxLength={200} />
        </Field>
        <Field label="Nome fantasia" error={errors.nome_fantasia}>
          <Input value={values.nome_fantasia ?? ''} onChange={(e) => set('nome_fantasia', e.target.value)} maxLength={200} />
        </Field>
        <Field label="Razão social" error={errors.razao_social}>
          <Input value={values.razao_social ?? ''} onChange={(e) => set('razao_social', e.target.value)} maxLength={300} />
        </Field>
        <Field label="CNPJ" error={errors.cnpj}>
          <Input value={values.cnpj ?? ''} onChange={(e) => set('cnpj', e.target.value)} maxLength={20} />
        </Field>
        <Field label="E-mail" error={errors.email}>
          <Input type="email" value={values.email ?? ''} onChange={(e) => set('email', e.target.value)} maxLength={255} />
        </Field>
        <Field label="Telefone" error={errors.phone}>
          <Input value={values.phone ?? ''} onChange={(e) => set('phone', e.target.value)} maxLength={30} />
        </Field>
        <Field label="Cidade" error={errors.city}>
          <Input value={values.city ?? ''} onChange={(e) => set('city', e.target.value)} maxLength={100} />
        </Field>
        <Field label="UF" error={errors.state}>
          <Input value={values.state ?? ''} onChange={(e) => set('state', e.target.value.toUpperCase())} maxLength={2} />
        </Field>
      </div>
      <Field label="Observações" error={errors.notes}>
        <Textarea rows={3} value={values.notes ?? ''} onChange={(e) => set('notes', e.target.value)} maxLength={2000} />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cadastrar empresa
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