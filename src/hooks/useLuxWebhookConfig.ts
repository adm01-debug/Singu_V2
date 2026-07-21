import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

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

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['lux-webhook-config', user?.id],
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lux_webhook_config')
        .select('*')
        .order('entity_type')
        .limit(1000);
      if (error) throw error;
      return (data || []) as unknown as LuxWebhookConfig[];
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
            headers: config.headers as Record<string, string>,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lux_webhook_config')
          .insert({
            entity_type: config.entity_type as 'contact' | 'company',
            webhook_url: config.webhook_url,
            is_active: config.is_active ?? true,
            timeout_ms: config.timeout_ms ?? 5000,
            max_retries: config.max_retries ?? 3,
            headers: (config.headers ?? {}) as Record<string, string>
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

        const status = res.ok ? 'success' : `error:${res.status}`;
        await supabase
          .from('lux_webhook_config')
          .update({ last_test_at: new Date().toISOString(), last_test_status: status })
          .eq('id', config.id);
        qc.invalidateQueries({ queryKey: ['lux-webhook-config'] });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return status;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro';
        await supabase
          .from('lux_webhook_config')
          .update({ last_test_at: new Date().toISOString(), last_test_status: `error:${msg}` })
          .eq('id', config.id);
        qc.invalidateQueries({ queryKey: ['lux-webhook-config'] });
        throw err;
      }
    },
    onSuccess: () => toast.success('✅ Webhook respondeu com sucesso'),
    onError: (e) => toast.error(`❌ Falha no teste: ${parseApiError(e)}`),
  });

  const getConfigForEntity = (entityType: string) => configs.find(c => c.entity_type === entityType && c.is_active);

  return { configs, isLoading, upsert, toggleActive, testWebhook, getConfigForEntity };
}
