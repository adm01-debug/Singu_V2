import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'textarea' | 'select' | 'checkbox' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

export interface MarketingForm {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  fields: FormField[];
  routing_rules: { type: 'round_robin' | 'specific'; members: string[] };
  nurturing_workflow_id: string | null;
  redirect_url: string | null;
  success_message: string | null;
  is_published: boolean;
  view_count: number;
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  user_id: string;
  contact_id: string | null;
  data: Record<string, unknown>;
  routed_to: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  page_url: string | null;
  created_at: string;
}

const KEY_BASE = ['marketing-forms'];

export function useForms() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const KEY = [...KEY_BASE, user?.id];

  const { data: forms = [], isLoading } = useQuery({
    queryKey: KEY,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((f) => ({
        ...f,
        fields: Array.isArray(f.fields) ? f.fields : [],
        routing_rules: f.routing_rules || { type: 'round_robin', members: [] },
      })) as unknown as MarketingForm[];
    },
    staleTime: 60_000,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<MarketingForm> & { name: string; slug: string }) => {
      if (!user) throw new Error('Não autenticado');
      const payload = { ...input, user_id: user.id } as never;
      if (input.id) {
        const { error } = await supabase.from('forms').update(input as never).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('forms').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Formulário salvo!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('forms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Removido'); },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from('forms').update({ is_published } as never).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { forms, isLoading, upsert, remove, togglePublish };
}

export function useForm(id: string | undefined) {
  return useQuery({
    queryKey: ['marketing-form', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('forms').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        fields: Array.isArray(data.fields) ? data.fields : [],
        routing_rules: data.routing_rules || { type: 'round_robin', members: [] },
      } as unknown as MarketingForm;
    },
  });
}

export function useFormSubmissions(formId: string | undefined) {
  return useQuery({
    queryKey: ['form-submissions', formId],
    enabled: !!formId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('form_id', formId!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as FormSubmission[];
    },
  });
}
