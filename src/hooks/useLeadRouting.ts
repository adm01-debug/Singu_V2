import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/errorMessages';
import type {
  LeadRoutingRule,
  LeadAssignment,
  SalesTeamMember,
} from '@/types/leadRouting';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

const RULES_KEY_BASE = ['lead-routing-rules'];
const ASSIGNMENTS_KEY_BASE = ['lead-assignments'];

// ── Routing Rules ──
export function useRoutingRules() {
  const { user } = useAuth();
  const RULES_KEY = [...RULES_KEY_BASE, user?.id];
  return useQuery({
    queryKey: RULES_KEY,
    queryFn: async (): Promise<LeadRoutingRule[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('lead_routing_rules')
        .select('id, user_id, name, description, rule_type, priority, conditions, team_pool, role_filter, is_active, fallback_rule_id, created_at, updated_at')
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as unknown as LeadRoutingRule[];
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
  });
}

export function useCreateRoutingRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<LeadRoutingRule>) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('lead_routing_rules')
        .insert({ ...rule, user_id: user.id } as TablesInsert<'lead_routing_rules'>)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar regra de roteamento');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RULES_KEY_BASE });
      toast.success('Regra criada');
    },
    onError: () => toast.error('Erro ao criar regra'),
  });
}

export function useUpdateRoutingRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeadRoutingRule> & { id: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('lead_routing_rules')
        .update(updates as TablesUpdate<'lead_routing_rules'>)
        .eq('user_id', user.id)
        .eq('id', id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Regra não encontrada');
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RULES_KEY_BASE });
      toast.success('Regra atualizada');
    },
    onError: () => toast.error('Erro ao atualizar regra'),
  });
}

export function useDeleteRoutingRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase
        .from('lead_routing_rules')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: RULES_KEY_BASE });
      toast.success('Regra removida');
    },
    onError: () => toast.error('Erro ao remover regra'),
  });
}

// ── Lead Assignments ──
export function useLeadAssignments(status?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...ASSIGNMENTS_KEY_BASE, status, user?.id],
    queryFn: async (): Promise<LeadAssignment[]> => {
      if (!user) return [];
      let query = supabase
        .from('lead_assignments')
        .select('id, user_id, contact_id, company_id, assigned_to, assigned_by, assignment_type, previous_owner, status, routing_rule_id, sla_deadline, first_contact_at, sla_met, notes, created_at, updated_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as unknown as LeadAssignment[];
    },
    enabled: !!user,
    staleTime: 2 * 60_000,
  });
}

export function useDistributeLead() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      contactId,
      companyId,
      ruleId,
      eligibleMembers,
    }: {
      contactId?: string;
      companyId?: string;
      ruleId?: string;
      eligibleMembers: SalesTeamMember[];
    }) => {
      if (!user) throw new Error('Não autenticado');
      if (!Array.isArray(eligibleMembers) || eligibleMembers.length === 0) {
        throw new Error('Nenhum vendedor elegível');
      }

      // Weighted round-robin: sort by last_assigned_at, weighted by 1/weight
      const sorted = [...eligibleMembers]
        .filter((m) => m.current_lead_count < m.max_leads_total && m.leads_today < m.max_leads_day)
        .sort((a, b) => {
          const aTime = a.last_assigned_at ? new Date(a.last_assigned_at).getTime() : 0;
          const bTime = b.last_assigned_at ? new Date(b.last_assigned_at).getTime() : 0;
          const timeDiff = aTime - bTime;
          const weightDiff = b.weight - a.weight;
          return timeDiff + weightDiff * -100_000;
        });

      if (sorted.length === 0) throw new Error('Todos os vendedores atingiram o limite');

      const selected = sorted[0];

      const [{ error: assignError }, { error: updateError }] = await Promise.all([
        supabase.from('lead_assignments').insert({
          user_id: user.id,
          contact_id: contactId ?? null,
          company_id: companyId ?? null,
          assigned_to: selected.id,
          assigned_by: null,
          assignment_type: 'auto_weighted',
          status: 'active',
          routing_rule_id: ruleId ?? null,
          sla_deadline: new Date(Date.now() + 4 * 3600_000).toISOString(),
        } as TablesInsert<'lead_assignments'>),
        supabase.from('sales_team_members').update({
          current_lead_count: selected.current_lead_count + 1,
          leads_today: selected.leads_today + 1,
          last_assigned_at: new Date().toISOString(),
        } as TablesUpdate<'sales_team_members'>).eq('user_id', user.id).eq('id', selected.id),
      ]);
      if (assignError) throw assignError;
      if (updateError) logger.error('Erro ao atualizar contadores:', updateError);

      return selected;
    },
    onSuccess: (member) => {
      qc.invalidateQueries({ queryKey: ASSIGNMENTS_KEY_BASE });
      qc.invalidateQueries({ queryKey: ['sales-team-members'] });
      toast.success(`Lead distribuído para ${member.name}`);
    },
    onError: (err) => toast.error(parseApiError(err, 'Erro na distribuição')),
  });
}
