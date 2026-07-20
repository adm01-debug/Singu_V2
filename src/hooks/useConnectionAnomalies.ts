import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type AnomalyType =
  | 'error_spike'
  | 'latency_degradation'
  | 'suspicious_window'
  | 'volume_drop'
  | 'volume_spike'
  | 'schema_drift';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ConnectionAnomaly {
  id: string;
  webhook_id: string | null;
  connection_id: string | null;
  anomaly_type: AnomalyType;
  severity: AnomalySeverity;
  explanation: string;
  metrics: Record<string, unknown>;
  window_start: string;
  window_end: string;
  detected_at: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  model_used: string | null;
  confidence: number | null;
  created_at: string;
}

export function useConnectionAnomalies(opts?: { onlyOpen?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: anomalies = [], isLoading } = useQuery({
    queryKey: ['connection_anomalies', opts?.onlyOpen ?? true],
    queryFn: async () => {
      let q = supabase
        .from('connection_anomalies')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(50);
      if (opts?.onlyOpen ?? true) q = q.is('acknowledged_at', null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ConnectionAnomaly[];
    },
  });

  const acknowledge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('connection_anomalies')
        .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: user?.id ?? null })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['connection_anomalies'] });
      toast.success('Anomalia reconhecida');
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  const triggerScan = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('connection-anomaly-detector', { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['connection_anomalies'] });
      toast.success(`Detecção concluída — ${d?.inserted ?? 0} anomalia(s) encontrada(s)`);
    },
    onError: (e) => toast.error(`Erro: ${e.message}`),
  });

  return { anomalies, isLoading, acknowledge, triggerScan };
}
