import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentTemplate {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  document_type: string;
  content_html: string;
  merge_fields: string[];
  category: string | null;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentSignature {
  id: string;
  user_id: string;
  template_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  signer_name: string;
  signer_email: string;
  rendered_html: string;
  merge_data: Record<string, string>;
  status: 'pending' | 'viewed' | 'signed' | 'declined' | 'expired';
  signature_token: string;
  signature_typed: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_FIELDS = [
  '{{contato.nome}}',
  '{{contato.email}}',
  '{{contato.telefone}}',
  '{{empresa.nome}}',
  '{{empresa.cnpj}}',
  '{{data.hoje}}',
  '{{vendedor.nome}}',
  '{{vendedor.email}}',
];

export function extractMergeFields(html: string): string[] {
  const matches = html.match(/\{\{[^}]+\}\}/g) || [];
  return Array.from(new Set(matches));
}

export function renderMergeFields(html: string, data: Record<string, string>): string {
  let out = html;
  for (const [key, value] of Object.entries(data)) {
    const safe = (value ?? '').toString();
    out = out.split(key).join(safe);
  }
  return out;
}

export function useDocumentTemplates() {
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['document_templates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((t: any) => ({
        ...t,
        merge_fields: Array.isArray(t.merge_fields) ? t.merge_fields : [],
      })) as unknown as DocumentTemplate[];
    },
    staleTime: 60_000,
  });

  const create = useMutation({
    mutationFn: async (input: Partial<DocumentTemplate>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const merge_fields = extractMergeFields(input.content_html || '');
      const { error } = await supabase.from('document_templates').insert({
        user_id: user.id,
        name: input.name!,
        description: input.description ?? null,
        document_type: input.document_type ?? 'contract',
        content_html: input.content_html!,
        merge_fields,
        category: input.category ?? null,
        is_active: input.is_active ?? true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document_templates'] });
      toast.success('Template criado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: Partial<DocumentTemplate> & { id: string }) => {
      const merge_fields = input.content_html ? extractMergeFields(input.content_html) : undefined;
      const { error } = await (supabase
        .from('document_templates') as any)
        .update({ ...input, ...(merge_fields ? { merge_fields } : {}) })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document_templates'] });
      toast.success('Template atualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('document_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document_templates'] });
      toast.success('Template removido');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { templates, isLoading, create, update, remove, defaultFields: DEFAULT_FIELDS };
}

export function useDocumentSignatures() {
  const qc = useQueryClient();

  const { data: signatures = [], isLoading } = useQuery({
    queryKey: ['document_signatures'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from('document_signatures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DocumentSignature[];
    },
    staleTime: 30_000,
  });

  const sendForSignature = useMutation({
    mutationFn: async (input: {
      template_id?: string;
      contact_id?: string;
      company_id?: string;
      signer_name: string;
      signer_email: string;
      rendered_html: string;
      merge_data: Record<string, string>;
      expires_in_days?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');
      const expires_at = input.expires_in_days
        ? new Date(Date.now() + input.expires_in_days * 86_400_000).toISOString()
        : null;
      const { data, error } = await (supabase
        .from('document_signatures') as any)
        .insert({
          user_id: user.id,
          template_id: input.template_id ?? null,
          contact_id: input.contact_id ?? null,
          company_id: input.company_id ?? null,
          signer_name: input.signer_name,
          signer_email: input.signer_email,
          rendered_html: input.rendered_html,
          merge_data: input.merge_data,
          expires_at,
        })
        .select()
        .single();
      if (error) throw error;
      if (input.template_id) {
        // Increment usage_count (best-effort)
        const { data: tpl } = await supabase
          .from('document_templates')
          .select('usage_count')
          .eq('id', input.template_id)
          .maybeSingle();
        if (tpl) {
          await (supabase
            .from('document_templates') as any)
            .update({ usage_count: ((tpl as any).usage_count ?? 0) + 1 })
            .eq('id', input.template_id);
        }
      }
      return data as unknown as DocumentSignature;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document_signatures'] });
      toast.success('Documento enviado para assinatura');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase
        .from('document_signatures') as any)
        .update({ status: 'declined', declined_at: new Date().toISOString(), declined_reason: 'Cancelado pelo remetente' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['document_signatures'] });
      toast.success('Assinatura cancelada');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = {
    total: signatures.length,
    pending: signatures.filter((s) => s.status === 'pending').length,
    viewed: signatures.filter((s) => s.status === 'viewed').length,
    signed: signatures.filter((s) => s.status === 'signed').length,
    declined: signatures.filter((s) => s.status === 'declined').length,
    signedRate:
      signatures.length === 0
        ? 0
        : Math.round((signatures.filter((s) => s.status === 'signed').length / signatures.length) * 100),
  };

  return { signatures, isLoading, sendForSignature, cancel, stats };
}
