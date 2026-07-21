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
    queryKey: ['team-dashboard', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return { members: [] as TeamMemberStats[], isManager: false };

      const { data: allMembers } = await supabase
        .from('sales_team_members')
        .select('id, name, role, user_id, manager_id, vacation_end')
        .order('name')
        .limit(1000);

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

      // Enrich with counts — 3 batched queries total instead of 3N individual queries
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
      const uids = teamMembers.map(m => m.user_id).filter((id): id is string => Boolean(id));

      const [{ data: allContacts }, { data: allInteractions }, { data: allDeals }] = await Promise.all([
        uids.length > 0 ? supabase.from('contacts').select('user_id').in('user_id', uids).limit(50000) : Promise.resolve({ data: [] }),
        uids.length > 0 ? supabase.from('interactions').select('user_id').in('user_id', uids).gte('created_at', monthAgo.toISOString()).limit(50000) : Promise.resolve({ data: [] }),
        // 'deals' is a planned table not yet in the generated types — cast is intentional until migration runs
        uids.length > 0 ? supabase.from('deals' as never).select('user_id, value, stage').in('user_id', uids).limit(5000) : Promise.resolve({ data: [] }),
      ]);

      const contactCountMap = new Map<string, number>();
      for (const r of allContacts || []) contactCountMap.set(r.user_id, (contactCountMap.get(r.user_id) || 0) + 1);

      const interactionCountMap = new Map<string, number>();
      for (const r of allInteractions || []) interactionCountMap.set(r.user_id, (interactionCountMap.get(r.user_id) || 0) + 1);

      type DealRow = { user_id: string; value: number; stage: string };
      const dealsByUid = new Map<string, DealRow[]>();
      for (const d of (allDeals as DealRow[] || [])) {
        const list = dealsByUid.get(d.user_id) || [];
        list.push(d);
        dealsByUid.set(d.user_id, list);
      }

      const enriched = teamMembers.map((m) => {
        const uid = m.user_id;
        const isOnVacation = !!(m.vacation_end && new Date(m.vacation_end) > new Date());
        if (!uid) {
          return { id: m.id, name: m.name, role: m.role || 'vendedor', contacts_count: 0, interactions_this_month: 0, deals_count: 0, pipeline_value: 0, won_deals_value: 0, is_on_vacation: isOnVacation };
        }
        const dealList = dealsByUid.get(uid) || [];
        return {
          id: m.id, name: m.name, role: m.role || 'vendedor',
          contacts_count: contactCountMap.get(uid) || 0,
          interactions_this_month: interactionCountMap.get(uid) || 0,
          deals_count: dealList.length,
          pipeline_value: dealList.reduce((s, d) => s + (Number(d.value) || 0), 0),
          won_deals_value: dealList.filter(d => d.stage === 'won').reduce((s, d) => s + (Number(d.value) || 0), 0),
          is_on_vacation: isOnVacation,
        };
      });

      return { members: enriched, isManager: true };
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}
