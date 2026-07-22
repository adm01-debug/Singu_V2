import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { RoutingMetrics, AssignmentType } from '@/types/leadRouting';

export function useRoutingMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['routing-metrics', user?.id],
    queryFn: async (): Promise<RoutingMetrics> => {
      if (!user) return emptyMetrics();

      const [assignmentsRes, handoffsRes, redistRes, teamRes] = await Promise.all([
        supabase.from('lead_assignments').select('status, assignment_type, sla_met, first_contact_at, created_at, assigned_to').eq('user_id', user.id),
        supabase.from('handoff_requests').select('status').eq('user_id', user.id).eq('status', 'pending'),
        supabase.from('redistribution_log').select('id').eq('user_id', user.id).limit(200),
        supabase.from('sales_team_members').select('role, is_active').eq('user_id', user.id).limit(200),
      ]);

      const assignments = (assignmentsRes.data ?? []) as Array<{
        status: string;
        assignment_type: string;
        sla_met: boolean | null;
        first_contact_at: string | null;
        created_at: string;
        assigned_to: string;
      }>;

      const active = assignments.filter((a) => a.status === 'active');
      const withSla = assignments.filter((a) => a.sla_met !== null);
      const slaMet = withSla.filter((a) => a.sla_met === true).length;
      const slaCompliance = withSla.length > 0 ? Math.round((slaMet / withSla.length) * 100) : 100;

      const contactTimes = assignments
        .filter((a) => a.first_contact_at)
        .map((a) => {
          const created = new Date(a.created_at).getTime();
          const contacted = new Date(a.first_contact_at!).getTime();
          return (contacted - created) / 3_600_000;
        });
      const avgFirstContact =
        contactTimes.length > 0
          ? Math.round((contactTimes.reduce((s, v) => s + v, 0) / contactTimes.length) * 10) / 10
          : 0;

      const byType = assignments.reduce(
        (acc, a) => {
          const t = a.assignment_type as AssignmentType;
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        },
        {} as Record<AssignmentType, number>,
      );

      const team = (teamRes.data ?? []) as Array<{ role: string; is_active: boolean }>;
      const activeTeam = team.filter((t) => t.is_active);

      return {
        totalAssignments: assignments.length,
        activeAssignments: active.length,
        slaCompliance,
        avgFirstContactHours: avgFirstContact,
        redistributions: redistRes.data?.length ?? 0,
        pendingHandoffs: handoffsRes.data?.length ?? 0,
        byRole: {
          sdr: activeTeam.filter((t) => t.role === 'sdr').length,
          closer: activeTeam.filter((t) => t.role === 'closer').length,
        },
        byType,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

function emptyMetrics(): RoutingMetrics {
  return {
    totalAssignments: 0,
    activeAssignments: 0,
    slaCompliance: 100,
    avgFirstContactHours: 0,
    redistributions: 0,
    pendingHandoffs: 0,
    byRole: { sdr: 0, closer: 0 },
    byType: {} as Record<AssignmentType, number>,
  };
}
