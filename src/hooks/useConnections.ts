import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type ConnectionType = 'supabase_external' | 'bitrix24' | 'n8n' | 'mcp_claude' | 'custom';

export interface ConnectionConfig {
  id: string;
  name: string;
  connection_type: ConnectionType;
  description: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  secret_refs: Record<string, string>;
  last_tested_at: string | null;
  last_test_status: string | null;
  last_test_latency_ms: number | null;
  last_test_message: string | null;
  discovered_schema: Record<string, unknown> | null;
  discovered_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ConnectionTestLog {
  id: string;
  connection_id: string;
  status: string;
  latency_ms: number | null;
  message: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export function useConnections() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connection_configs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connection_configs')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ConnectionConfig[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<ConnectionConfig> & { name: string; connection_type: ConnectionType }) => {
      if (!user) throw new Error('Não autenticado');

      if (input.id) {
        const { error } = await supabase
          .from('connection_configs')
          .update({
            name: input.name,
            description: input.description,
            is_active: input.is_active ?? true,
            config: (input.config ?? {}) as never,
            secret_refs: (input.secret_refs ?? {}) as never,
          })
          .eq('id', input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('connection_configs').insert({
          name: input.name,
          connection_type: input.connection_type,
          description: input.description ?? null,
          is_active: input.is_active ?? true,
          config: (input.config ?? {}) as never,
          secret_refs: (input.secret_refs ?? {}) as never,
          created_by: user.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connection_configs'] });
      toast.success('Conexão salva');
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('connection_configs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connection_configs'] });
      toast.success('Conexão removida');
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('connection_configs')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connection_configs'] }),
  });

  const test = useMutation({
    mutationFn: async (params: { connection_id?: string; connection_type: ConnectionType; config: Record<string, unknown> }) => {
      const { data, error } = await supabase.functions.invoke('connection-tester', { body: params });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error ?? 'Teste falhou');
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['connection_configs'] });
      toast.success(`✅ ${data.message ?? 'Conexão OK'} (${data.latency_ms}ms)`);
    },
    onError: (e) => toast.error(`❌ ${e.message}`),
  });

  return { connections, isLoading, upsert, remove, toggleActive, test };
}

export function useConnectionTestLogs(connectionId: string | undefined) {
  return useQuery({
    queryKey: ['connection_test_logs', connectionId],
    enabled: !!connectionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('connection_test_logs')
        .select('*')
        .eq('connection_id', connectionId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as ConnectionTestLog[];
    },
  });
}
