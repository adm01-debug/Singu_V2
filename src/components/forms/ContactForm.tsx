import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useMemo } from 'react';
import { ContactAvatarUpload } from '@/components/forms/ContactAvatarUpload';
import { useFormDraft } from '@/hooks/useFormDraft';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import type { Contact } from '@/hooks/useContacts';
import type { Company } from '@/hooks/useCompanies';
import { ContactFormTabs } from './contact-form/ContactFormTabs';

const contactSchema = z.object({
  first_name: z.string().trim().min(1, 'Nome é obrigatório').max(50),
  last_name: z.string().trim().min(1, 'Sobrenome é obrigatório').max(50),
  apelido: z.string().trim().max(50).optional().or(z.literal('')),
  nome_tratamento: z.string().trim().max(50).optional().or(z.literal('')),
  sexo: z.string().optional().or(z.literal('')),
  cpf: z.string().trim().max(14).optional().or(z.literal('')),
  birthday: z.string().optional(),
  company_id: z.string().uuid('Selecione uma empresa').optional().nullable(),
  role: z.string().optional(),
  role_title: z.string().trim().max(100).optional(),
  cargo: z.string().trim().max(100).optional().or(z.literal('')),
  departamento: z.string().trim().max(100).optional().or(z.literal('')),
  source: z.string().trim().max(100).optional().or(z.literal('')),
  relationship_stage: z.string().optional(),
  email: z.string().trim().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional(),
  whatsapp: z.string().trim().max(20).optional(),
  linkedin: z.string().trim().max(200).optional(),
  instagram: z.string().trim().max(50).optional(),
  twitter: z.string().trim().max(50).optional().or(z.literal('')),
  avatar_url: z.string().trim().max(500).optional().or(z.literal('').transform(() => undefined)),
  notes: z.string().trim().max(2000).optional(),
  personal_notes: z.string().trim().max(2000).optional().or(z.literal('')),
  assinatura_contato: z.string().trim().max(500).optional().or(z.literal('')),
   tags_array: z.array(z.string()).optional().default([]),
   interests_array: z.array(z.string()).optional().default([]),
   hobbies: z.array(z.string()).optional().default([]),
  family_info: z.string().trim().max(2000).optional().or(z.literal('')),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactFormProps {
  contact?: Contact | null;
  companies: Company[];
  defaultCompanyId?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function getField(c: Record<string, unknown> | null | undefined, field: string, fallback = '') {
  if (!c) return fallback;
  return (c[field] as string) ?? fallback;
}

const parseCommaSeparated = (val: string | null | undefined): string[] | null => {
  if (!val || !val.trim()) return null;
  return val.split(',').map(s => s.trim()).filter(Boolean);
};

export function ContactForm({ contact, companies, defaultCompanyId, onSubmit, onCancel, isSubmitting }: ContactFormProps) {
  const c = contact as Record<string, unknown> | null;

  const form = useForm<ContactFormData>({
    // zod v4 + resolvers v5: input (campos) e output (parseado) divergem; o form segue tipado pelo output como na v3.
    resolver: zodResolver(contactSchema) as unknown as Resolver<ContactFormData>,
    mode: 'onBlur',
    defaultValues: {
      first_name: getField(c, 'first_name'), last_name: getField(c, 'last_name'),
      apelido: getField(c, 'apelido'), nome_tratamento: getField(c, 'nome_tratamento'),
      sexo: getField(c, 'sexo'), cpf: getField(c, 'cpf'), birthday: getField(c, 'birthday'),
      company_id: getField(c, 'company_id') || defaultCompanyId || null,
      role: getField(c, 'role', 'contact'), role_title: getField(c, 'role_title'),
      cargo: getField(c, 'cargo'), departamento: getField(c, 'departamento'),
      source: getField(c, 'source'), relationship_stage: getField(c, 'relationship_stage', 'unknown'),
      email: getField(c, 'email'), phone: getField(c, 'phone'), whatsapp: getField(c, 'whatsapp'),
      linkedin: getField(c, 'linkedin'), instagram: getField(c, 'instagram'), twitter: getField(c, 'twitter'),
      notes: getField(c, 'notes'), personal_notes: getField(c, 'personal_notes'),
      assinatura_contato: getField(c, 'assinatura_contato'),
       tags_array: Array.isArray(c?.tags_array) ? c.tags_array : [],
       interests_array: Array.isArray(c?.interests_array) ? c.interests_array : [],
       hobbies: Array.isArray(c?.hobbies) ? c.hobbies : (Array.isArray(c?.hobbies_array) ? c.hobbies_array : []),
      family_info: getField(c, 'family_info'), avatar_url: getField(c, 'avatar_url'),
    },
  });

  const draftKey = contact ? `contact-edit-${(contact as Record<string, unknown>).id}` : 'contact-new';
  const { clearDraft } = useFormDraft(form, { key: draftKey, enabled: !contact });

  const phoneValue = useWatch({ control: form.control, name: 'phone' });
  const whatsappValue = useWatch({ control: form.control, name: 'whatsapp' });
  useEffect(() => { if (!contact && phoneValue && !whatsappValue) form.setValue('whatsapp', phoneValue, { shouldDirty: false }); }, [phoneValue, contact, form, whatsappValue]);

  const selectedCompanyId = useWatch({ control: form.control, name: 'company_id' });
  const roleTitleValue = useWatch({ control: form.control, name: 'role_title' });
  const suggestedRoleTitle = useMemo(() => {
    if (contact || roleTitleValue) return null;
    const company = companies.find(comp => comp.id === selectedCompanyId);
    if (!company?.industry) return null;
    const suggestions: Record<string, string> = { 'Tecnologia': 'Gerente de TI', 'Saúde': 'Diretor Clínico', 'Educação': 'Coordenador Pedagógico', 'Varejo': 'Gerente Comercial', 'Financeiro': 'Diretor Financeiro', 'Jurídico': 'Advogado Sênior', 'Marketing': 'Diretor de Marketing', 'Indústria': 'Gerente de Produção', 'Construção': 'Engenheiro de Obras', 'Consultoria': 'Consultor Sênior' };
    return suggestions[company.industry] || null;
  }, [selectedCompanyId, companies, contact, roleTitleValue]);

  const selectedRole = useWatch({ control: form.control, name: 'role' });
  useEffect(() => { if (!contact && selectedRole === 'buyer') form.setValue('relationship_stage', 'qualified_lead', { shouldDirty: false }); }, [selectedRole, contact, form]);

   const handleSubmit = async (data: ContactFormData) => {
     const cleaned: Record<string, unknown> = {};
     for (const [key, value] of Object.entries(data)) { 
       cleaned[key] = value === '' || value === undefined ? null : value; 
     }
     
     // The fields are already arrays thanks to TagInput
     cleaned.tags_array = data.tags_array;
     cleaned.interests_array = data.interests_array;
     cleaned.hobbies = data.hobbies;
     
     await onSubmit(cleaned);
     clearDraft();
   };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <ContactAvatarUpload avatarUrl={form.watch('avatar_url') || null} onAvatarChange={(url) => form.setValue('avatar_url', url || '', { shouldDirty: true })} contactId={(contact as Record<string, unknown>)?.id as string | undefined} />
          <div><h3 className="font-semibold">{contact ? 'Editar Contato' : 'Novo Contato'}</h3><p className="text-sm text-muted-foreground">{contact ? 'Atualize as informações do contato' : 'Preencha os dados do contato'}</p></div>
        </div>
        <ContactFormTabs form={form} companies={companies} suggestedRoleTitle={suggestedRoleTitle} contact={contact} />
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{contact ? 'Salvar Alterações' : 'Criar Contato'}</Button>
        </div>
      </form>
    </Form>
  );
}
