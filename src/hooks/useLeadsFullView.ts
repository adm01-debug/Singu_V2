import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface LeadFull {
  id: string;
  codigo: string | null;
  pipeline_id: string | null;
  stage_id: string | null;
  status: string | null;
  company_id: string | null;
  contact_id: string | null;
  empresa_nome: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  contato_cargo: string | null;
  campanha: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  temperatura: string | null;
  score: number | null;
  prioridade: string | null;
  valor_estimado: number | null;
  data_primeiro_contato: string | null;
  data_ultimo_contato: string | null;
  data_qualificacao: string | null;
  interesse: string | null;
  observacoes: string | null;
  tags_array: string[] | null;
  motivo_desqualificacao: string | null;
  created_at: string;
  pipeline_nome: string | null;
  stage_nome: string | null;
  stage_cor: string | null;
  source_nome: string | null;
}

export function useLeadsFullView(contactId?: string, companyId?: string, limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['leads-full', contactId, companyId, limit, user?.id],
    queryFn: async () => {
      const filters: Array<{ type: 'eq'; column: string; value: unknown }> = [];
      if (contactId) filters.push({ type: 'eq', column: 'contact_id', value: contactId });
      if (companyId) filters.push({ type: 'eq', column: 'company_id', value: companyId });
      filters.push({ type: 'eq', column: 'user_id', value: user!.id });
      const { data, error } = await queryExternalData<LeadFull>({
        table: 'vw_leads_full',
        filters,
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!(contactId || companyId) && !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
