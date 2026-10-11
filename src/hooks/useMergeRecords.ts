import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/errorMessages';

export type MergeEntity = 'contacts' | 'companies';

const contactOverridesSchema = z.object({
  first_name: z.string().nullable(), last_name: z.string().nullable(), email: z.string().nullable(),
  phone: z.string().nullable(), role_title: z.string().nullable(), company_id: z.string().nullable(),
  whatsapp: z.string().nullable(), linkedin: z.string().nullable(), instagram: z.string().nullable(),
  notes: z.string().nullable(), family_info: z.string().nullable(),
}).partial().strict();
const companyOverridesSchema = z.object({
  nome_crm: z.string().nullable(), cnpj: z.string().nullable(), industry: z.string().nullable(),
  website: z.string().nullable(), notes: z.string().nullable(), tags: z.array(z.string()).nullable(),
}).partial().strict();

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
      if (!user?.id) throw new Error('Não autenticado');

      const contactOverrides = entity === 'contacts' ? contactOverridesSchema.parse(fieldOverrides ?? {}) : null;
      const companyOverrides = entity === 'companies' ? companyOverridesSchema.parse(fieldOverrides ?? {}) : null;
      const overrides = contactOverrides ?? companyOverrides ?? {};

      // 1. Apply overrides on primary (if any)
      if (Object.keys(overrides).length > 0) {
        const update = entity === 'contacts'
          ? supabase.from('contacts').update(contactOverrides)
          : supabase.from('companies').update(companyOverrides);
        const { error: updErr } = await update.eq('user_id', user.id).eq('id', primaryId);
        if (updErr) throw updErr;
      }

      // 2. Repoint relations when merging companies (contacts.company_id)
      if (entity === 'companies') {
        const { error: repointErr } = await supabase
          .from('contacts')
          .update({ company_id: primaryId })
          .eq('user_id', user!.id)
          .eq('company_id', secondaryId);
        if (repointErr) throw repointErr;
      }

      // 3. Delete the secondary
      const { error: delErr } = await supabase.from(entity).delete().eq('user_id', user!.id).eq('id', secondaryId);
      if (delErr) throw delErr;

      // 4. Audit log entry
      if (user?.id) {
        const { error: auditErr } = await supabase.from('audit_log').insert([{
          user_id: user.id,
          action: 'merge',
          entity_type: entity,
          entity_id: primaryId,
          table_name: entity,
          record_id: primaryId,
          old_data: { merged_from: secondaryId },
          new_data: overrides,
        }]);
        if (auditErr) {
          logger.warn('Falha ao gravar auditoria da mesclagem', { error: auditErr.message });
          throw auditErr;
        }
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
    onError: (e: Error) => toast.error(`Falha ao mesclar: ${parseApiError(e)}`),
  });
}
