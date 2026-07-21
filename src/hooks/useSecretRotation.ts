import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { hashForAudit } from '@/lib/secretRotation';
import { parseApiError } from '@/lib/errorMessages';

export interface SecretRotationEntry {
  id: string;
  secret_name: string;
  rotated_at: string;
  rotated_by: string | null;
  old_hash: string | null;
  new_hash: string | null;
  reason: string | null;
  is_automatic: boolean;
  created_at: string;
}

/** Lista de secrets conhecidos no sistema */
export const KNOWN_SECRETS = [
  { name: 'CRON_SECRET', description: 'Autenticação de cron jobs', critical: true },
  { name: 'ELEVENLABS_API_KEY', description: 'API de voz (STT/TTS)', critical: false },
  { name: 'EVOLUTION_API_KEY', description: 'WhatsApp Evolution API', critical: false },
  { name: 'EVOLUTION_API_URL', description: 'URL da Evolution API', critical: false },
  { name: 'ENRICHLAYER_API_KEY', description: 'Enriquecimento LinkedIn', critical: false },
  { name: 'PROXYCURL_API_KEY', description: 'Scraping de perfis', critical: false },
  { name: 'FIRECRAWL_API_KEY', description: 'Raspagem web (conector)', critical: false },
] as const;

export function useSecretRotation() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: rotationLogs = [], isLoading } = useQuery({
    queryKey: ['secret-rotation-logs', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('secret_rotation_log')
        .select('id, secret_name, rotated_at, rotated_by, old_hash, new_hash, reason, is_automatic, created_at')
        .order('rotated_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as unknown as SecretRotationEntry[];
    },
  });

  const logRotation = useMutation({
    mutationFn: async (params: {
      secretName: string;
      newHash: string;
      reason: string;
    }) => {
      const lastLog = rotationLogs.find(l => l.secret_name === params.secretName);
      const { error } = await supabase
        .from('secret_rotation_log')
        .insert([{
          secret_name: params.secretName,
          rotated_by: user?.id,
          old_hash: lastLog?.new_hash || null,
          new_hash: params.newHash,
          reason: params.reason,
          is_automatic: false,
        }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secret-rotation-logs'] });
      toast.success('Rotação registrada com sucesso');
    },
    onError: (e) => toast.error(`Erro ao registrar rotação: ${parseApiError(e)}`),
  });

  /** Último log de rotação por secret */
  const getLastRotation = (secretName: string): SecretRotationEntry | undefined => {
    return rotationLogs.find(l => l.secret_name === secretName);
  };

  /** Histórico de rotação de um secret específico */
  const getHistory = (secretName: string): SecretRotationEntry[] => {
    return rotationLogs.filter(l => l.secret_name === secretName);
  };

  return {
    rotationLogs,
    isLoading,
    logRotation,
    getLastRotation,
    getHistory,
    hashForAudit,
  };
}
