import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { logger } from '@/lib/logger';

export interface WorkspaceAccount {
  id: string;
  contact_id: string;
  workspace_name?: string;
  account_type?: string;
  account_status?: string;
  role_in_workspace?: string;
  permissions?: string[];
  last_active_at?: string;
  created_at?: string;
}

export function useWorkspaceAccounts(contactId: string | undefined) {
  return useQuery({
    queryKey: ['workspace-accounts', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<WorkspaceAccount>({
        table: 'workspace_accounts',
        select: '*',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 49 },
      });
      if (error) {
        logger.error('Error loading workspace accounts:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
  });
}
