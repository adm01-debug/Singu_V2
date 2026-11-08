-- Retenção do histórico do pg_cron: mantém 7 dias em cron.job_run_details.
-- Motivo: em 2026-11-08 a tabela tinha 692.671 linhas (135 MB), 665.906 delas com mais de
-- 7 dias, acumuladas desde 2026-04-08 — o pg_cron não limpa esse histórico sozinho. A limpeza
-- foi feita à mão naquele dia; esta migration agenda para não voltar a acumular.
-- Mesmo padrão de public.cleanup_rpc_perf_samples() (20260723154748_e54bdf5c...sql:234).
-- Permissão: cron.job_run_details pertence a supabase_admin, mas `postgres` tem DELETE e
-- SELECT nela e USAGE no schema cron (verificado em 2026-11-08), concedidos direto e não
-- por herança de role. A função é SECURITY DEFINER, então roda como quem a criou.

BEGIN;

CREATE OR REPLACE FUNCTION public.cleanup_cron_job_run_details(_dias integer DEFAULT 7)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _apagadas bigint;
BEGIN
  IF _dias < 1 THEN
    RAISE EXCEPTION 'retencao minima de 1 dia (recebido: %)', _dias;
  END IF;
  DELETE FROM cron.job_run_details
   WHERE start_time < now() - make_interval(days => _dias);
  GET DIAGNOSTICS _apagadas = ROW_COUNT;
  RETURN _apagadas;
END;
$$;

COMMENT ON FUNCTION public.cleanup_cron_job_run_details(integer) IS
  'Apaga execucoes do pg_cron com mais de _dias (default 7) de cron.job_run_details. Agendada em cleanup_cron_job_run_details_daily.';

-- REVOKE em cascata: PUBLIC remove herança padrão; authenticated e anon revocados
-- explicitamente porque Supabase pode conceder EXECUTE implicitamente a authenticated
-- em schemas públicos — has_function_privilege() mostraria true sem estes REVOKEs.
REVOKE ALL ON FUNCTION public.cleanup_cron_job_run_details(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_cron_job_run_details(integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_cron_job_run_details(integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.cleanup_cron_job_run_details(integer) TO service_role;

-- Agendamento diário (idempotente). 04:37 UTC = 01:37 BRT: fora do minuto 0 e sem colidir
-- com cleanup_rpc_perf_samples_daily (03:15 UTC).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('cleanup_cron_job_run_details_daily')
      WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup_cron_job_run_details_daily');
    PERFORM cron.schedule(
      'cleanup_cron_job_run_details_daily',
      '37 4 * * *',
      $CRON$ SELECT public.cleanup_cron_job_run_details(7); $CRON$
    );
  END IF;
END $$;

COMMIT;

-- DOWN MIGRATION (rollback)
/*
BEGIN;
SELECT cron.unschedule('cleanup_cron_job_run_details_daily')
 WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup_cron_job_run_details_daily');
DROP FUNCTION IF EXISTS public.cleanup_cron_job_run_details(integer);
COMMIT;
*/
