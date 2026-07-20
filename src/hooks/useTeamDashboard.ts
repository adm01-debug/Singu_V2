import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TeamMemberStats {
  id: string;
  name: string;
  role: string;
  contacts_count: number;
  interactions_this_month: number;
  deals_count: number;
  pipeline_value: number;
  won_deals_value: number;
  is_on_vacation: boolean;
}

export function useTeamDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['team-dashboard'],
    queryFn: async () => {
      if (!user) return { members: [] as TeamMemberStats[], isManager: false };

      const { data: allMembers } = await supabase
        .from('sales_team_members')
        .select('id, name, role, user_id, manager_id, vacation_end')
        .order('name');

      if (!allMembers?.length) return { members: [] as TeamMemberStats[], isManager: false };

      const currentMember = allMembers.find(m => m.user_id === user.id);
      if (!currentMember) return { members: [] as TeamMemberStats[], isManager: false };

      // Check reports
      let teamMembers = allMembers.filter(m => m.manager_id === currentMember.id || m.user_id === user.id);

      if (teamMembers.length <= 1) {
        // Check if admin
        const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (!isAdmin) return { members: [] as TeamMemberStats[], isManager: false };
        teamMembers = allMembers;
      }

      // Enrich with counts — all members processed concurrently, 3 queries per member in parallel
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      const enriched = await Promise.all(teamMembers.map(async (m) => {
        const uid = m.user_id;
        const isOnVacation = !!(m.vacation_end && new Date(m.vacation_end) > new Date());
        if (!uid) {
          return { id: m.id, name: m.name, role: m.role || 'vendedor', contacts_count: 0, interactions_this_month: 0, deals_count: 0, pipeline_value: 0, won_deals_value: 0, is_on_vacation: isOnVacation };
        }

        const [{ count: cc }, { count: ic }, { data: deals }] = await Promise.all([
          supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', uid),
          supabase.from('interactions').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', monthAgo.toISOString()),
          supabase.from('deals' as never).select('value, stage').eq('user_id', uid),
        ]);

        const dealList = (deals as Array<{ value: number; stage: string }>) || [];
        return {
          id: m.id, name: m.name, role: m.role || 'vendedor',
          contacts_count: cc || 0, interactions_this_month: ic || 0,
          deals_count: dealList.length,
          pipeline_value: dealList.reduce((s, d) => s + (Number(d.value) || 0), 0),
          won_deals_value: dealList.filter(d => d.stage === 'won').reduce((s, d) => s + (Number(d.value) || 0), 0),
          is_on_vacation: isOnVacation,
        };
      }));

      return { members: enriched, isManager: true };
    },
    staleTime: 5 * 60_000,
  });
}
