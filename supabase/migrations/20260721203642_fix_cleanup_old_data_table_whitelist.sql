-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721203642
-- nome:   fix_cleanup_old_data_table_whitelist

CREATE OR REPLACE FUNCTION public.cleanup_old_data(
  p_table_name    text,
  p_date_column   text    DEFAULT 'created_at',
  p_retention_days integer DEFAULT 365,
  p_dry_run       boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_allowed_tables CONSTANT text[] := ARRAY[
    'access_blocked_log',
    'audit_log',
    'automation_executions',
    'automation_logs',
    'cnpj_cache',
    'data_quality_audits',
    'device_login_notifications',
    'disc_communication_logs',
    'email_logs',
    'guardrail_ml_logs',
    'import_jobs',
    'integration_logs',
    'lead_score_history',
    'login_attempts',
    'notifications',
    'redistribution_log',
    'relationship_score_history',
    'report_executions',
    'rfm_history',
    'score_history',
    'sdr_alert_history',
    'search_products_cache',
    'secret_rotation_log',
    'semantic_search_cache',
    'staging_portal_sicoob',
    'sync_log',
    'webhook_logs'
  ];
  v_col_type      text;
  count_to_delete bigint;
  deleted_count   bigint := 0;
  cutoff_date     timestamptz := now() - (p_retention_days || ' days')::interval;
BEGIN
  IF p_table_name != ALL(v_allowed_tables) THEN
    RETURN jsonb_build_object(
      'error', format('Table "%s" is not eligible for automated cleanup', p_table_name)
    );
  END IF;

  SELECT data_type INTO v_col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = p_table_name
    AND column_name  = p_date_column;

  IF v_col_type IS NULL THEN
    RETURN jsonb_build_object(
      'error', format('Column "%s" does not exist on table "%s"', p_date_column, p_table_name)
    );
  END IF;

  IF v_col_type NOT IN (
    'timestamp with time zone', 'timestamp without time zone',
    'date', 'timestamptz', 'timestamp'
  ) THEN
    RETURN jsonb_build_object(
      'error', format('Column "%s" is type "%s", not a date/timestamp', p_date_column, v_col_type)
    );
  END IF;

  EXECUTE format(
    'SELECT COUNT(*) FROM %I WHERE %I < $1',
    p_table_name, p_date_column
  ) INTO count_to_delete USING cutoff_date;

  IF NOT p_dry_run THEN
    EXECUTE format(
      'DELETE FROM %I WHERE %I < $1',
      p_table_name, p_date_column
    ) USING cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'table_name',        p_table_name,
    'date_column',       p_date_column,
    'retention_days',    p_retention_days,
    'cutoff_date',       cutoff_date,
    'records_to_delete', count_to_delete,
    'records_deleted',   deleted_count,
    'dry_run',           p_dry_run
  );
END;
$$;
