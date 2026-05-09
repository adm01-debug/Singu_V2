import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

export interface WeeklyReportSettings {
  id: string;
  user_id: string;
  enabled: boolean;
  send_day: string;
  send_time: string;
  email_address: string | null;
  include_portfolio_summary: boolean;
  include_at_risk_clients: boolean;
  include_health_alerts: boolean;
  include_upcoming_dates: boolean;
  include_recommendations: boolean;
  include_performance_metrics: boolean;
  last_sent_at: string | null;
}

export interface WeeklyReportData {
  id: string;
  user_id: string;
  report_data: {
    generatedAt: string;
    period: { start: string; end: string };
    portfolioSummary: {
      totalContacts: number;
      totalCompanies: number;
      totalInteractions: number;
      avgHealthScore: number;
      healthyClients: number;
      warningClients: number;
      criticalClients: number;
    };
    atRiskClients: Array<{
      id: string;
      name: string;
      healthScore: number;
      daysSinceContact: number;
      reason: string;
    }>;
    upcomingDates: Array<{
      id: string;
      contactName: string;
      type: string;
      date: string;
      daysUntil: number;
    }>;
    recommendations: string[];
    performanceMetrics: {
      interactionsThisWeek: number;
      interactionsLastWeek: number;
      newContacts: number;
      completedFollowUps: number;
      pendingFollowUps: number;
    };
  };
  sent_via: string[];
  created_at: string;
}

const DEFAULT_SETTINGS: Omit<WeeklyReportSettings, 'id' | 'user_id' | 'last_sent_at'> = {
  enabled: true,
  send_day: 'monday',
  send_time: '09:00',
  email_address: null,
  include_portfolio_summary: true,
  include_at_risk_clients: true,
  include_health_alerts: true,
  include_upcoming_dates: true,
  include_recommendations: true,
  include_performance_metrics: true
};

export const DAY_OPTIONS = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
] as const;

export function useWeeklyReport() {
  const { user } = useAuth();
  const userId = user?.id;
  const [settings, setSettings] = useState<WeeklyReportSettings | null>(null);
  const [reports, setReports] = useState<WeeklyReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('weekly_report_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      setSettings(data as WeeklyReportSettings | null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching weekly report settings:', { error: msg });
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchReports = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setReports((data || []) as unknown as WeeklyReportData[]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error fetching weekly reports:', { error: msg });
    }
  }, [userId]);

  useEffect(() => {
    fetchSettings();
    fetchReports();
  }, [fetchSettings, fetchReports]);

  const saveSettings = useCallback(async (newSettings: Partial<WeeklyReportSettings>) => {
    if (!userId) return;
    try {
      const toSave = { ...DEFAULT_SETTINGS, ...settings, ...newSettings, user_id: userId };
      const { data, error } = await supabase
        .from('weekly_report_settings')
        .upsert(toSave, { onConflict: 'user_id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao salvar configurações');
      setSettings(data as WeeklyReportSettings);
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error saving settings:', { error: msg });
      toast.error('Erro ao salvar configurações', { description: msg });
    }
  }, [userId, settings]);

  const generateReport = useCallback(async () => {
    if (!userId) return null;
    setGenerating(true);
    try {
      toast.info('Gerando relatório semanal...');
      const { data, error } = await supabase.functions.invoke('weekly-digest', {
        body: { userId, generateOnly: true }
      });
      if (error) throw error;
      const userDigest = data.digests?.find((d: { userId: string }) => d.userId === userId);
      if (userDigest) {
        toast.success('Relatório gerado com sucesso!');
        fetchReports();
        return userDigest;
      }
      toast.info('Relatório gerado - verifique seu email se configurado');
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error generating report:', { error: msg });
      toast.error('Erro ao gerar relatório', { description: msg });
      return null;
    } finally {
      setGenerating(false);
    }
  }, [userId, fetchReports]);

  const sendTestEmail = useCallback(async () => {
    if (!userId || !settings?.email_address) {
      toast.error('Configure um email primeiro');
      return;
    }
    try {
      toast.info('Enviando email de teste...');
      const { error } = await supabase.functions.invoke('weekly-digest', {
        body: { userId, sendEmail: true, testMode: true }
      });
      if (error) throw error;
      toast.success('Email de teste enviado!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error sending test email:', { error: msg });
      toast.error('Erro ao enviar email', { description: 'Verifique se o Resend está configurado.' });
    }
  }, [userId, settings]);

  return {
    settings,
    reports,
    loading,
    generating,
    saveSettings,
    generateReport,
    sendTestEmail,
    dayOptions: DAY_OPTIONS,
    refreshSettings: fetchSettings,
    refreshReports: fetchReports
  };
}
