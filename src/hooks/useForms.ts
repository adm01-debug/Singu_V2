import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

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
        .select('id, user_id, name, slug, description, fields, routing_rules, nurturing_workflow_id, redirect_url, success_message, is_published, view_count, submission_count, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []).map((f) => ({
        ...f,
        fields: Array.isArray(f.fields) ? f.fields : [],
        routing_rules: f.routing_rules || { type: 'round_robin', members: [] },
      })) as unknown as MarketingForm[];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<MarketingForm> & { name: string; slug: string }) => {
      if (!user) throw new Error('Não autenticado');
      const payload = { ...input, user_id: user.id } as TablesInsert<'forms'>;
      if (input.id) {
        const { error } = await supabase.from('forms').update(input as TablesUpdate<'forms'>).eq('user_id', user.id).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('forms').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Formulário salvo!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('forms').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); toast.success('Removido'); },
    onError: () => toast.error('Erro ao remover formulário'),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('forms').update({ is_published } as TablesUpdate<'forms'>).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
    onError: () => toast.error('Erro ao alterar status de publicação'),
  });

  return { forms, isLoading, upsert, remove, togglePublish };
}

export function useForm(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['marketing-form', id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('forms').select('id, user_id, name, slug, description, fields, routing_rules, nurturing_workflow_id, redirect_url, success_message, is_published, view_count, submission_count, created_at, updated_at').eq('id', id!).eq('user_id', user!.id).maybeSingle();
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
  const { user } = useAuth();
  return useQuery({
    queryKey: ['form-submissions', formId, user?.id],
    enabled: !!formId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_submissions')
        .select('id, form_id, user_id, contact_id, data, routed_to, utm_source, utm_medium, utm_campaign, page_url, created_at')
        .eq('form_id', formId!)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as FormSubmission[];
    },
  });
}
