
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL UNIQUE,
  date_column TEXT NOT NULL DEFAULT 'created_at',
  retention_days INTEGER NOT NULL CHECK (retention_days > 0),
  action TEXT NOT NULL DEFAULT 'delete' CHECK (action IN ('delete','anonymize')),
  extra_where TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  last_run_at TIMESTAMPTZ,
  last_deleted_count BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.data_retention_policies TO authenticated;
GRANT ALL ON public.data_retention_policies TO service_role;

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view retention policies"
  ON public.data_retention_policies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage retention policies"
  ON public.data_retention_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages retention policies"
  ON public.data_retention_policies FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_data_retention_policies_updated_at
  BEFORE UPDATE ON public.data_retention_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.data_retention_policies (table_name, date_column, retention_days, description) VALUES
  ('whatsapp_messages',            'created_at',  730, 'Mensagens WhatsApp — 2 anos'),
  ('call_logs',                    'created_at',  730, 'Registros de ligações — 2 anos'),
  ('interactions',                 'created_at', 1095, 'Interações comerciais — 3 anos'),
  ('social_profiles',              'updated_at',  365, 'Perfis sociais — 1 ano'),
  ('social_behavior_analysis',     'created_at',  365, 'Análise comportamental social — 1 ano'),
  ('ai_chat_messages',             'created_at',  180, 'Mensagens de chat da IA — 6 meses'),
  ('login_attempts',               'created_at',   90, 'Tentativas de login — 90 dias'),
  ('notification_logs',            'created_at',   90, 'Logs de notificação — 90 dias'),
  ('automation_logs',              'created_at',   90, 'Logs de automação — 90 dias'),
  ('crm_automation_logs',          'created_at',   90, 'Logs de automação CRM — 90 dias'),
  ('error_logs',                   'created_at',   90, 'Logs de erro — 90 dias'),
  ('incoming_webhook_logs',        'created_at',   90, 'Logs de webhook — 90 dias'),
  ('connection_test_logs',         'created_at',   90, 'Logs de teste de conexão — 90 dias'),
  ('access_blocked_log',           'created_at',   90, 'Log de bloqueios de acesso — 90 dias'),
  ('sequence_events',              'created_at',  365, 'Eventos de sequência — 1 ano'),
  ('sequence_send_log',            'created_at',  365, 'Envios de sequência — 1 ano'),
  ('sms_campaign_recipients',      'created_at',  365, 'Recipientes de campanhas SMS — 1 ano'),
  ('contact_cadence_audit',        'created_at',  730, 'Auditoria de cadência — 2 anos'),
  ('contact_preferences_audit',    'created_at',  730, 'Auditoria de preferências — 2 anos'),
  ('contact_relatives_audit',      'created_at',  730, 'Auditoria de familiares — 2 anos'),
  ('contact_time_analysis_audit',  'created_at',  730, 'Auditoria de análise de tempo — 2 anos'),
  ('interactions_audit',           'created_at',  730, 'Auditoria de interações — 2 anos'),
  ('disc_analysis_history_audit',  'created_at',  730, 'Auditoria DISC — 2 anos'),
  ('psychographic_audit_log',      'created_at',  730, 'Auditoria psicográfica — 2 anos'),
  ('social_consent_audit',         'created_at',  730, 'Auditoria de consentimento social — 2 anos'),
  ('reframing_analysis_audit',     'created_at',  730, 'Auditoria de reframing — 2 anos'),
  ('life_events_history',          'created_at',  730, 'Histórico de eventos de vida — 2 anos'),
  ('neuro_behavioral_history',     'created_at',  730, 'Histórico neuro-comportamental — 2 anos'),
  ('social_life_events',           'created_at',   90, 'Eventos sociais descartados — 90 dias')
ON CONFLICT (table_name) DO NOTHING;

UPDATE public.data_retention_policies
SET extra_where = 'status IN (''dismissed'',''rejected'')'
WHERE table_name = 'social_life_events' AND extra_where IS NULL;

CREATE OR REPLACE FUNCTION public.apply_retention_policies()
RETURNS TABLE(tbl TEXT, deleted_count BIGINT, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  pol RECORD;
  del_count BIGINT;
  sql_cmd TEXT;
  where_clause TEXT;
BEGIN
  FOR pol IN SELECT * FROM public.data_retention_policies WHERE is_active = true LOOP
    BEGIN
      where_clause := format('%I < now() - interval ''%s days''', pol.date_column, pol.retention_days);
      IF pol.extra_where IS NOT NULL AND length(trim(pol.extra_where)) > 0 THEN
        where_clause := where_clause || ' AND (' || pol.extra_where || ')';
      END IF;

      sql_cmd := format('DELETE FROM public.%I WHERE %s', pol.table_name, where_clause);
      EXECUTE sql_cmd;
      GET DIAGNOSTICS del_count = ROW_COUNT;

      UPDATE public.data_retention_policies
        SET last_run_at = now(), last_deleted_count = del_count
        WHERE id = pol.id;

      INSERT INTO public.audit_log (table_name, operation, record_id, changed_by, new_data, changed_at)
      VALUES (pol.table_name, 'RETENTION_PURGE', pol.id, NULL,
              jsonb_build_object('deleted', del_count, 'retention_days', pol.retention_days), now());

      tbl := pol.table_name; deleted_count := del_count; error_message := NULL;
      RETURN NEXT;
    EXCEPTION WHEN OTHERS THEN
      tbl := pol.table_name; deleted_count := 0; error_message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.apply_retention_policies() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_retention_policies() TO service_role;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'apply-data-retention-daily') THEN
      PERFORM cron.unschedule('apply-data-retention-daily');
    END IF;
    PERFORM cron.schedule('apply-data-retention-daily', '15 3 * * *',
      'SELECT public.apply_retention_policies();');
  END IF;
END $$;
