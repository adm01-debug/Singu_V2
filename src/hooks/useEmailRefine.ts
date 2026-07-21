import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export interface RefineParams {
  original: string;
  subject?: string;
  instruction: string;
  tone?: 'formal' | 'casual' | 'friendly';
}

export interface RefineResult {
  subject?: string;
  message: string;
}

async function refineEmail(params: RefineParams): Promise<RefineResult> {
  const { data, error } = await supabase.functions.invoke('ai-email-refine', { body: params });
  if (error) {
    logger.error('email-refine invoke error', error);
    throw error instanceof Error ? error : new Error('Falha ao refinar email');
  }
  if (!data?.message) throw new Error('Resposta inválida do refinamento');
  return { subject: data.subject, message: data.message };
}

export function useEmailRefine() {
  return useMutation<RefineResult, Error, RefineParams>({
    mutationFn: refineEmail,
    onError: (e) => toast.error(parseApiError(e, 'Erro ao refinar email')),
  });
}
