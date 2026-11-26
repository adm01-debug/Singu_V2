import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export type Percentual = string | number | null;

export interface RegraAutomacaoRow {
  user_id: string | null;
  rule_id: string | null;
  rule_name: string | null;
  trigger_type: string | null;
  is_active: boolean | null;
  execution_count: number | null;
  last_executed_at: string | null;
  last_error: string | null;
  successful_runs: number | null;
  failed_runs: number | null;
}

export interface NotificacaoUsuarioRow {
  user_id: string | null;
  email: string | null;
  unread_notifications: number | null;
  urgent_notifications: number | null;
  todays_reminders: number | null;
  overdue_reminders: number | null;
  active_alerts: number | null;
  last_notification: string | null;
  last_digest: string | null;
  email_enabled: boolean | null;
  push_enabled: boolean | null;
  daily_digest_enabled: boolean | null;
  weekly_digest_enabled: boolean | null;
}

export interface ApelidoProgressoRow {
  vendedor: string | null;
  total_contatos: number | null;
  com_apelido: number | null;
  sem_apelido: number | null;
  percentual_preenchido: Percentual;
}

export interface CanalStatsRow {
  channel: string | null;
  total: number | null;
  ultimos_30d: number | null;
  ultimos_7d: number | null;
  empresas_distintas: number | null;
  contatos_distintos: number | null;
}

function consultar<T>(table: string, order?: { column: string; ascending: boolean }) {
  return queryExternalData<T>({
    table,
    select: '*',
    order,
    countMethod: 'exact',
    auditAccess: false,
  });
}

export function useAutomacoesPainel() {
  return useQuery({
    queryKey: ['automacoes', 'painel'],
    queryFn: async () => {
      const [regras, notificacoes, apelidos, canais] = await Promise.all([
        consultar<RegraAutomacaoRow>('vw_singu_automation_dashboard', { column: 'rule_name', ascending: true }),
        consultar<NotificacaoUsuarioRow>('vw_notification_dashboard', { column: 'unread_notifications', ascending: false }),
        consultar<ApelidoProgressoRow>('vw_apelidos_progresso', { column: 'total_contatos', ascending: false }),
        consultar<CanalStatsRow>('v_channel_stats', { column: 'total', ascending: false }),
      ]);

      const erro = [regras, notificacoes, apelidos, canais].find((resultado) => resultado.error)?.error;
      if (erro) throw erro;

      return {
        regras: regras.data ?? [],
        notificacoes: notificacoes.data ?? [],
        apelidos: apelidos.data ?? [],
        canais: canais.data ?? [],
      };
    },
    staleTime: 2 * 60_000,
  });
}