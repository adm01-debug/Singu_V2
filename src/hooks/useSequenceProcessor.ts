import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export function useSequenceProcessor() {
  return useMutation({
    retry: 0,
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('sequence-processor', { body: {} });
      if (error) throw error;
      const result = data as { ok: boolean; stats: Record<string, number> };
      if (!result.ok) throw new Error(`Processamento incompleto: ${result.stats.errors} falha(s); verifique as inscrições pausadas.`);
      return result;
    },
    onSuccess: (data) => {
      const { stats } = data;
      toast.success(`Processador rodou: ${stats.sent} enviados, ${stats.advanced} avançados, ${stats.paused} pausados`);
    },
    onError: (e: Error) => toast.error(`Erro: ${parseApiError(e)}`),
  });
}
