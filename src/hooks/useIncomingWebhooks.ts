import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import type { Json, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

export type WebhookTargetEntity = 'contact' | 'company' | 'deal' | 'interaction' | 'note' | 'custom';

export interface IncomingWebhook {
  id: string;
  name: string;
  description: string | null;
  token: string;
  target_entity: WebhookTargetEntity;
  is_active: boolean;
  allowed_origins: string[];
  field_mapping: Record<string, string>;
  total_calls: number;
  total_errors: number;
  last_called_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  webhook_secret: string | null;
  require_signature: boolean;
  replay_window_seconds: number;
}

export interface IncomingWebhookLog {
  id: string;
  webhook_id: string;
  status: string;
  http_status: number | null;
  payload: Record<string, unknown> | null;
  response: Record<string, unknown> | null;
  error_message: string | null;
  source_ip: string | null;
  latency_ms: number | null;
  created_at: string;
}

function genToken() {
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

export function useIncomingWebhooks() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['incoming_webhooks', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incoming_webhooks')
        .select('*')
        .eq('created_by', user!.id)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as IncomingWebhook[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<IncomingWebhook> & { name: string; target_entity: WebhookTargetEntity }) => {
      if (!user) throw new Error('Não autenticado');

      if (input.id) {
        const { error } = await supabase.from('incoming_webhooks').update({
          name: input.name,
          description: input.description ?? null,
          target_entity: input.target_entity,
          is_active: input.is_active ?? true,
          allowed_origins: input.allowed_origins ?? [],
          field_mapping: (input.field_mapping ?? {}) as unknown as Json,
          require_signature: input.require_signature ?? false,
          webhook_secret: input.webhook_secret ?? null,
          replay_window_seconds: input.replay_window_seconds ?? 300,
        } as TablesUpdate<'incoming_webhooks'>).eq('created_by', user!.id).eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('incoming_webhooks').insert({
          name: input.name,
          description: input.description ?? null,
          token: input.token ?? genToken(),
          target_entity: input.target_entity,
          is_active: input.is_active ?? true,
          allowed_origins: input.allowed_origins ?? [],
          field_mapping: (input.field_mapping ?? {}) as unknown as Json,
          require_signature: input.require_signature ?? false,
          webhook_secret: input.webhook_secret ?? null,
          replay_window_seconds: input.replay_window_seconds ?? 300,
          created_by: user.id,
        } as TablesInsert<'incoming_webhooks'>);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incoming_webhooks'] });
      toast.success('Webhook salvo');
    },
    onError: (e) => toast.error(`Erro: ${parseApiError(e)}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('incoming_webhooks').delete().eq('created_by', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incoming_webhooks'] });
      toast.success('Webhook removido');
    },
    onError: () => toast.error('Erro ao remover webhook'),
  });

  const rotateToken = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('incoming_webhooks').update({ token: genToken() }).eq('created_by', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incoming_webhooks'] });
      toast.success('Token rotacionado');
    },
    onError: () => toast.error('Erro ao rotacionar token'),
  });

  return { webhooks, isLoading, upsert, remove, rotateToken };
}

export function useIncomingWebhookLogs(webhookId: string | undefined) {
  return useQuery({
    queryKey: ['incoming_webhook_logs', webhookId],
    enabled: !!webhookId,
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incoming_webhook_logs')
        .select('*')
        .eq('webhook_id', webhookId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as IncomingWebhookLog[];
    },
  });
}
