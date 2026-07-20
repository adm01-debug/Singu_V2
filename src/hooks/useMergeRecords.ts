import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type MergeEntity = 'contacts' | 'companies';

interface MergeArgs {
  entity: MergeEntity;
  primaryId: string;
  secondaryId: string;
  /** Field-level overrides to apply on the primary before deleting the secondary */
  fieldOverrides?: Record<string, unknown>;
}

/**
 * Local merge: applies field overrides on the primary record then deletes the secondary.
 * Related rows referencing the secondary (contacts.company_id, etc.) are repointed.
 */
export function useMergeRecords() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entity, primaryId, secondaryId, fieldOverrides }: MergeArgs) => {
      if (primaryId === secondaryId) throw new Error('IDs idênticos');

      // 1. Apply overrides on primary (if any)
      if (fieldOverrides && Object.keys(fieldOverrides).length > 0) {
        const { error: updErr } = await supabase
          .from(entity)
          .update(fieldOverrides)
          .eq('id', primaryId);
        if (updErr) throw updErr;
      }

      // 2. Repoint relations when merging companies (contacts.company_id)
      if (entity === 'companies') {
        const { error: repointErr } = await supabase
          .from('contacts')
          .update({ company_id: primaryId })
          .eq('company_id', secondaryId);
        if (repointErr) throw repointErr;
      }

      // 3. Delete the secondary
      const { error: delErr } = await supabase.from(entity).delete().eq('id', secondaryId);
      if (delErr) throw delErr;

      // 4. Audit log entry
      if (user?.id) {
        await supabase.from('audit_log').insert([{
          user_id: user!.id,
          action: 'merge',
          entity_type: entity,
          entity_id: primaryId,
          old_data: { merged_from: secondaryId },
          new_data: (fieldOverrides ?? {}) as Record<string, never>,
        }]);
      }

      return { primaryId, secondaryId };
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['dedup-source', vars.entity] });
      qc.invalidateQueries({ queryKey: [vars.entity] });
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Registros mesclados com sucesso');
    },
    onError: (e: Error) => toast.error(`Falha ao mesclar: ${e.message}`),
  });
}
