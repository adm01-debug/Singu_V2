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

export interface QuotaStatus {
  quota_type?: string;
  target?: number;
  achieved?: number;
  progress_pct?: number;
  remaining?: number;
  period?: string;
  status?: string;
  [key: string]: unknown;
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

export interface UserBadge {
  id?: string;
  badge_key?: string;
  badge_name?: string;
  description?: string;
  icon?: string;
  category?: string;
  earned_at?: string;
  rarity?: string;
  [key: string]: unknown;
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
        const { data, error } = await callExternalRpc<QuotaStatus | QuotaStatus[]>('get_quota_status', {});
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
        const { data, error } = await callExternalRpc<UserBadge[]>('get_user_badges', {});
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
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await callExternalRpc<unknown>('check_and_award_badges', {});
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
