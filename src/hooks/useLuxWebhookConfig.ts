import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';
import { z } from 'zod';
import { useRef } from 'react';

export interface LuxWebhookConfig {
  id: string;
  entity_type: 'contact' | 'company';
  webhook_url: string;
  is_active: boolean;
  timeout_ms: number;
  max_retries: number;
  headers: Record<string, string>;
  last_test_at: string | null;
  last_test_status: string | null;
  created_at: string;
  updated_at: string;
}

export function useLuxWebhookConfig() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const recordingFailures = useRef(new WeakSet<object>());

  const { data: configs = [], isLoading, error } = useQuery({
    queryKey: ['lux-webhook-config', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lux_webhook_config')
        .select('id, entity_type, webhook_url, is_active, timeout_ms, max_retries, headers, last_test_at, last_test_status, created_at, updated_at')
        .order('entity_type')
        .limit(20);
      if (error) throw error;
      return z.array(z.object({
        id: z.string(), entity_type: z.enum(['contact', 'company']), webhook_url: z.string(),
        is_active: z.boolean().nullable().transform(value => value ?? true),
        timeout_ms: z.number().nullable().transform(value => value ?? 60000),
        max_retries: z.number().nullable().transform(value => value ?? 3),
        headers: z.record(z.string()).nullable().transform(value => value ?? {}),
        last_test_at: z.string().nullable(), last_test_status: z.string().nullable(),
        created_at: z.string(), updated_at: z.string(),
      })).parse(data ?? []).map(row => ({
        id: row.id, entity_type: row.entity_type, webhook_url: row.webhook_url,
        is_active: row.is_active, timeout_ms: row.timeout_ms, max_retries: row.max_retries,
        headers: row.headers, last_test_at: row.last_test_at, last_test_status: row.last_test_status,
        created_at: row.created_at, updated_at: row.updated_at,
      } satisfies LuxWebhookConfig));
    },
  });

  const upsert = useMutation({
    mutationFn: async (config: Partial<LuxWebhookConfig> & { entity_type: string; webhook_url: string }) => {
      if (!user) throw new Error('Não autenticado');
      const existing = configs.find(c => c.entity_type === config.entity_type);
      if (existing) {
        const { error } = await supabase
          .from('lux_webhook_config')
          .update({
            webhook_url: config.webhook_url,
            is_active: config.is_active,
            timeout_ms: config.timeout_ms,
            max_retries: config.max_retries,
            headers: config.headers,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lux_webhook_config')
          .insert({
            user_id: user.id,
            config_name: `Lux ${config.entity_type}`,
            scrape_target: config.entity_type,
            entity_type: config.entity_type,
            webhook_url: config.webhook_url,
            is_active: config.is_active ?? true,
            timeout_ms: config.timeout_ms ?? 5000,
            max_retries: config.max_retries ?? 3,
            headers: config.headers ?? {}
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lux-webhook-config'] });
      toast.success('Configuração salva');
    },
    onError: (e: Error) => toast.error(`Erro: ${parseApiError(e)}`),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('lux_webhook_config')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lux-webhook-config'] });
      toast.success('Status atualizado');
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  const testWebhook = useMutation({
    mutationFn: async (entityType: string) => {
      if (!user) throw new Error('Não autenticado');
      const config = configs.find(c => c.entity_type === entityType);
      if (!config) throw new Error('Configuração não encontrada');
      if (!config.webhook_url.startsWith('https://')) throw new Error('URL do webhook deve usar HTTPS');

      let failure: Error | null = null;
      let status: string;
      try {
        const res = await fetch(config.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            luxRecordId: 'test-' + Date.now(),
            entityType,
            entityId: '00000000-0000-0000-0000-000000000000',
            entityData: { test: true },
            userId: 'test',
            callbackUrl: 'https://test.example.com',
          }),
          signal: AbortSignal.timeout(config.timeout_ms),
        });

        status = res.ok ? 'success' : `error:${res.status}`;
        if (!res.ok) failure = new Error(`HTTP ${res.status}`);
      } catch (err) {
        failure = err instanceof Error ? err : new Error('Erro ao chamar o webhook');
        status = `error:${failure.message}`;
      }
      const { error: statusError } = await supabase
        .from('lux_webhook_config')
        .update({ last_test_at: new Date().toISOString(), last_test_status: status })
        .eq('id', config.id);
      qc.invalidateQueries({ queryKey: ['lux-webhook-config'] });
      if (failure) {
        if (statusError) throw new AggregateError([failure, statusError], 'Falha no teste do webhook e no registro do resultado');
        throw failure;
      }
      if (statusError) {
        recordingFailures.current.add(statusError);
        throw statusError;
      }
      return status;
    },
    onSuccess: () => toast.success('Webhook respondeu com sucesso'),
    onError: (e) => recordingFailures.current.has(e)
      ? toast.warning(`Webhook respondeu com sucesso, mas o resultado não foi registrado: ${parseApiError(e)}`)
      : toast.error(`Falha no teste: ${parseApiError(e)}`),
  });

  const getConfigForEntity = (entityType: string) => configs.find(c => c.entity_type === entityType && c.is_active);

  return { configs, isLoading, error, upsert, toggleActive, testWebhook, getConfigForEntity };
}
