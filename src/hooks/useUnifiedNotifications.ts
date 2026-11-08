import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UnifiedNotification = {
  id: string;
  source: 'alert' | 'churn' | 'nps' | 'task';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description?: string | null;
  href: string;
  createdAt: string;
};

const PRIORITY_RANK: Record<UnifiedNotification['priority'], number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

export function useUnifiedNotifications() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['unified-notifications', user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<UnifiedNotification[]> => {
      const uid = user!.id;
      const [alertsRes, churnRes, npsRes] = await Promise.all([
        supabase.from('alerts')
          .select('id, title, description, priority, contact_id, action_url, created_at')
          .eq('user_id', uid)
          .eq('dismissed', false)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('churn_risk_scores')
          .select('id, contact_id, risk_level, risk_score, analyzed_at')
          .eq('user_id', uid)
          .in('risk_level', ['high', 'critical'])
          .order('risk_score', { ascending: false })
          .limit(10),
        supabase.from('csat_surveys')
          .select('id, contact_id, channel, sent_at, created_at, expires_at, status')
          .eq('user_id', uid)
          .eq('survey_type', 'nps')
          .in('status', ['pending', 'sent'])
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const items: UnifiedNotification[] = [];

      (alertsRes.data ?? []).forEach((a) => {
        items.push({
          id: `alert-${a.id}`,
          source: 'alert',
          priority: ((a.priority as UnifiedNotification['priority']) ?? 'medium'),
          title: a.title,
          description: a.description,
          href: a.action_url || (a.contact_id ? `/contatos/${a.contact_id}` : '/notificacoes'),
          createdAt: a.created_at,
        });
      });

      (churnRes.data ?? []).forEach((c) => {
        items.push({
          id: `churn-${c.id}`,
          source: 'churn',
          priority: c.risk_level === 'critical' ? 'critical' : 'high',
          title: `Risco de churn ${c.risk_level === 'critical' ? 'crítico' : 'alto'} (${c.risk_score})`,
          description: 'Contato com sinais fortes de evasão. Acione retenção.',
          href: `/contatos/${c.contact_id}`,
          createdAt: c.analyzed_at,
        });
      });

      (npsRes.data ?? []).forEach((s) => {
        items.push({
          id: `nps-${s.id}`,
          source: 'nps',
          priority: 'low',
          title: 'Pesquisa NPS pendente',
          description: s.status === 'pending'
            ? 'Link criado; compartilhe a pesquisa com o contato.'
            : `Aguardando resposta via ${s.channel ?? 'canal'}.`,
          href: '/nps',
          createdAt: s.sent_at ?? s.created_at,
        });
      });

      return items.sort((a, b) => {
        const p = PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
        if (p !== 0) return p;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    },
  });

  const items = query.data ?? [];
  return {
    items,
    count: items.length,
    criticalCount: items.filter(i => i.priority === 'critical' || i.priority === 'high').length,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
