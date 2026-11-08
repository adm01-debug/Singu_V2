import { useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { z } from 'zod';
import { parseApiError } from '@/lib/errorMessages';
import { areUuidsEqual } from '@/lib/utils';

export type MergeEntity = 'contacts' | 'companies';

const contactOverridesSchema = z.object({
  first_name: z.string().nullable(), last_name: z.string().nullable(), email: z.string().nullable(),
  phone: z.string().nullable(), role_title: z.string().nullable(), company_id: z.string().nullable(),
  whatsapp: z.string().nullable(), linkedin: z.string().nullable(), instagram: z.string().nullable(),
  notes: z.string().nullable(), family_info: z.string().nullable(),
}).partial().strict();
const companyOverridesSchema = z.object({
  nome_crm: z.string().regex(/\S/, 'Nome principal obrigatório'), cnpj: z.string().nullable(), industry: z.string().nullable(),
  website: z.string().nullable(), notes: z.string().nullable(), tags: z.array(z.string()).nullable(),
}).partial().strict();

interface MergeArgs {
  entity: MergeEntity;
  primaryId: string;
  secondaryId: string;
  fieldOverrides?: Record<string, unknown>;
}

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

      const { data, error } = await callExternalRpc<{
        success: boolean; primary_id: string; secondary_id: string;
      }>('merge_records_atomically', {
        p_entity: entity, p_primary_id: primaryId, p_secondary_id: secondaryId,
        p_field_overrides: overrides,
      });
      if (error) throw error;
      if (data?.success !== true || !areUuidsEqual(data.primary_id, primaryId) || !areUuidsEqual(data.secondary_id, secondaryId)) {
        throw new Error('Mesclagem não confirmada pelo banco');
      }
      return { primaryId, secondaryId };
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success('Registros mesclados com sucesso');
    },
    onError: (e: Error) => toast.error(`Falha ao mesclar: ${parseApiError(e)}`),
  });
}
