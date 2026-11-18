import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

// ── Types ──

export interface UserGoal {
  id?: string;
  title?: string;
  description?: string;
  target_value?: number;
  current_value?: number;
  progress_pct?: number;
  goal_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  [key: string]: unknown;
}

export interface GoalsDashboard {
  total_goals?: number;
  completed_goals?: number;
  in_progress_goals?: number;
  completion_rate?: number;
  streak_days?: number;
  goals?: UserGoal[];
  [key: string]: unknown;
}

/**
 * Retorno real de `get_quota_status(p_user_id)`: um único objeto jsonb com
 * a meta de receita vigente em `sales_goals`. O tipo anterior declarava
 * `quota_type`, `target`, `progress_pct`, `period` e `status`, que a função
 * nunca devolveu — o widget lia tudo isso como `undefined`.
 */
export interface QuotaStatus {
  user_id: string;
  quota: number;
  achieved: number;
  remaining: number;
  pct_achieved: number;
  days_elapsed: number | null;
  days_remaining: number;
  daily_required: number;
  on_track: boolean | null;
  pace_pct: number;
}

export interface LeaderboardEntry {
  rank?: number;
  user_id?: string;
  user_name?: string;
  avatar_url?: string;
  score?: number;
  deals_closed?: number;
  revenue?: number;
  badges_count?: number;
  [key: string]: unknown;
}

/**
 * Retorno real de `get_user_badges(p_user_id)`:
 * TABLE(badge_id uuid, badge_code text, badge_name text,
 *       badge_description text, badge_icon text, badge_category text,
 *       badge_points integer, earned_at timestamptz, is_recent boolean).
 *
 * O tipo anterior declarava `id`, `badge_key`, `description`, `icon`,
 * `category` e `rarity` — destes só `badge_name` e `earned_at` existiam, e
 * `rarity` nunca existiu em lugar nenhum do banco.
 */
export interface UserBadge {
  badge_id: string;
  badge_code: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string | null;
  badge_category: string | null;
  badge_points: number | null;
  earned_at: string;
  is_recent: boolean | null;
}

// ── Hooks ──

export function useUserGoals(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['gamification', 'user-goals', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<UserGoal[]>('get_user_goals', {});
        if (error) { logger.warn('[Gamification] get_user_goals error:', error); return []; }
        return (Array.isArray(data) ? data : []) as UserGoal[];
      } catch (e) { logger.warn('[Gamification] get_user_goals failed:', e); return []; }
    },
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useGoalsDashboard(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['gamification', 'goals-dashboard', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<GoalsDashboard>('get_goals_dashboard', {});
        if (error) { logger.warn('[Gamification] get_goals_dashboard error:', error); return null; }
        return (data ?? null) as GoalsDashboard | null;
      } catch (e) { logger.warn('[Gamification] get_goals_dashboard failed:', e); return null; }
    },
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useQuotaStatus(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['gamification', 'quota-status', user?.id],
    queryFn: async () => {
      try {
        // get_quota_status(p_user_id uuid) nao tem valor padrao: chamar sem
        // argumento faz o PostgREST nao encontrar a funcao, e o catch abaixo
        // devolvia lista vazia — o widget ficava em branco sem erro visivel.
        const { data, error } = await callExternalRpc<QuotaStatus | QuotaStatus[]>('get_quota_status', { p_user_id: user?.id });
        if (error) { logger.warn('[Gamification] get_quota_status error:', error); return []; }
        return (Array.isArray(data) ? data : data ? [data] : []) as QuotaStatus[];
      } catch (e) { logger.warn('[Gamification] get_quota_status failed:', e); return []; }
    },
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLeaderboard(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['gamification', 'leaderboard', user?.id],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<LeaderboardEntry[]>('get_leaderboard', {});
        if (error) { logger.warn('[Gamification] get_leaderboard error:', error); return []; }
        return (Array.isArray(data) ? data : []) as LeaderboardEntry[];
      } catch (e) { logger.warn('[Gamification] get_leaderboard failed:', e); return []; }
    },
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useUserBadges(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['gamification', 'user-badges', user?.id],
    queryFn: async () => {
      try {
        // get_user_badges(p_user_id uuid) tambem exige o argumento.
        const { data, error } = await callExternalRpc<UserBadge[]>('get_user_badges', { p_user_id: user?.id });
        if (error) { logger.warn('[Gamification] get_user_badges error:', error); return []; }
        return (Array.isArray(data) ? data : []) as UserBadge[];
      } catch (e) { logger.warn('[Gamification] get_user_badges failed:', e); return []; }
    },
    enabled: enabled && !!user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useCheckAndAwardBadges() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      // check_and_award_badges(p_user_id uuid) exige o argumento; sem ele a
      // premiação nunca rodou — `user_badges` está zerada em produção
      // enquanto `badges` tem 10 conquistas cadastradas.
      const { data, error } = await callExternalRpc<unknown>('check_and_award_badges', { p_user_id: user.id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification', 'user-badges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification', 'goals-dashboard'] });
    },
    onError: (err) => {
      logger.error('Error awarding badges:', err);
      toast.error('Erro ao verificar conquistas');
    },
  });
}
