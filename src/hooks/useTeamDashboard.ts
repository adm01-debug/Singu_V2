import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  return useQuery({
    queryKey: ['team-dashboard'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
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

      // Enrich with counts
      const enriched: TeamMemberStats[] = [];
      for (const m of teamMembers) {
        const uid = m.user_id;
        if (!uid) { 
          enriched.push({ 
            id: m.id, name: m.name, role: m.role || 'vendedor', 
            contacts_count: 0, interactions_this_month: 0, deals_count: 0, 
            pipeline_value: 0, won_deals_value: 0,
            is_on_vacation: !!(m.vacation_end && new Date(m.vacation_end) > new Date()) 
          }); 
          continue; 
        }

        const { count: cc } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('user_id', uid);
        const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
        const { count: ic } = await supabase.from('interactions').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', monthAgo.toISOString());
        
        // Fetch deals and pipeline with controlled casting for dynamic queries
        const { data: deals } = await supabase.from('deals' as any).select('value, stage').eq('user_id', uid);
        const dc = (deals as any[])?.length || 0;
        const pv = (deals as any[])?.reduce((s, d) => s + (Number(d.value) || 0), 0) || 0;
        const wv = (deals as any[])?.filter(d => d.stage === 'won').reduce((s, d) => s + (Number(d.value) || 0), 0) || 0;

        enriched.push({
          id: m.id, name: m.name, role: m.role || 'vendedor',
          contacts_count: cc || 0, interactions_this_month: ic || 0, 
          deals_count: dc, pipeline_value: pv, won_deals_value: wv,
          is_on_vacation: !!(m.vacation_end && new Date(m.vacation_end) > new Date()),
        });
      }

      return { members: enriched, isManager: true };
    },
    staleTime: 5 * 60_000,
  });
}
