import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateExternalData } from '@/lib/externalData';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export function useRapportIntelMutation(contactId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Record<string, unknown>) => {
      if (!contactId || !user) throw new Error('ID do contato ou usuário ausente');
      
      // We update the contact table which usually contains these rapport fields in this system's architecture
      // or a specific rapport table if available. Based on earlier context, contacts has these fields.
      const { data, error } = await updateExternalData('contacts', contactId, updates);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rapport-intel', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      queryClient.invalidateQueries({ queryKey: ['ficha360', contactId] });
      toast.success('Informações de rapport atualizadas');
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${parseApiError(error)}`);
    }
  });
}
