/**
 * Hook utilitário para restaurar entidades excluídas via Undo do toast destrutivo.
 * Reusa `insertExternalData` para re-inserir o snapshot completo capturado
 * antes do delete. Compatível com contacts, companies e tasks.
 */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { insertExternalData } from '@/lib/externalData';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';

type ExternalTable = 'contacts' | 'companies' | 'tasks';

const LOCAL_ONLY_BY_TABLE: Record<ExternalTable, Set<string>> = {
  contacts: new Set(['full_name', 'tags', 'interests', 'twitter', 'avatar_url', 'email', 'phone', 'whatsapp', 'linkedin', 'instagram', 'role_title']),
  companies: new Set(['name', 'industry', 'tags', 'notes', 'phone', 'email', 'address', 'city', 'state', 'instagram', 'linkedin', 'facebook', 'youtube', 'twitter', 'tiktok', 'merge_notes']),
  tasks: new Set([]),
};

export function useRestoreEntity() {
  const qc = useQueryClient();

  const restore = useCallback(async (
    table: ExternalTable,
    snapshot: Record<string, unknown>,
    invalidateKeys: readonly unknown[][] = [[table]],
  ) => {
    try {
      const localOnly = LOCAL_ONLY_BY_TABLE[table];
      const clean: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(snapshot)) {
        if (localOnly.has(k)) continue;
        if (v === undefined) continue;
        clean[k] = v;
      }
      const { data, error } = await insertExternalData<Record<string, unknown>>(table, clean);
      if (error) throw error;
      if (typeof snapshot.id !== 'string' || !snapshot.id || !data || data.id !== snapshot.id
        || (snapshot.user_id !== undefined && data.user_id !== snapshot.user_id) || data.deleted_at != null) {
        throw new Error('Restauração sem confirmação de um registro ativo correspondente.');
      }
      if (table === 'contacts' && typeof data.user_id === 'string') {
        const queryKey = ['contact', data.user_id, data.id];
        await qc.cancelQueries({ queryKey, exact: true });
        await qc.invalidateQueries({ queryKey, exact: true });
      }
      for (const key of invalidateKeys) {
        await qc.cancelQueries({ queryKey: key });
        await qc.invalidateQueries({ queryKey: key });
      }
      toast.success('Restaurado com sucesso');
      return true;
    } catch (err) {
      logger.error(`[useRestoreEntity] Failed to restore ${table}:`, err);
      toast.error('Não foi possível confirmar a restauração. Tente novamente.');
      return false;
    }
  }, [qc]);

  return { restore };
}
