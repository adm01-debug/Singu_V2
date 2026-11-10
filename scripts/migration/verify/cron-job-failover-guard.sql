-- cron-job-failover-guard.sql — Rodada 19/10
-- Proposito: pg_cron amarra cada job a um nodename; depois de failover/restore regional
--            jobs apontando para o host antigo ficam orfaos (nunca mais disparam).
-- Classe   : GUARD WARN (sai != 0; no full-audit conta como WARN)
-- Limiar   : job ativo cujo nodename nao e local (localhost, 127.0.0.1, ::1 ou vazio/socket).
-- Variaveis: nenhuma
-- Saida    : 0 = ok ou SKIP; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Requer   : pg_cron (tabela cron.job). Ausente: SKIP com NOTICE (passa).
\set ON_ERROR_STOP on
\pset pager off
\echo '== cron-job-failover-guard =='
SELECT to_regclass('cron.job') IS NOT NULL AS tem_cron,
       to_regclass('cron.job_run_details') IS NOT NULL AS tem_cron_runs \gset
\if :tem_cron
SELECT jobid, jobname, schedule, nodename, nodeport, database, username, active
  FROM cron.job
 ORDER BY jobid;
\if :tem_cron_runs
\echo '-- Jobs com falhas recentes (ultimos 7 dias) --'
SELECT j.jobname, r.status, r.return_message, r.start_time
  FROM cron.job_run_details r
  JOIN cron.job j ON j.jobid = r.jobid
 WHERE r.start_time > now() - interval '7 days'
   AND r.status <> 'succeeded'
 ORDER BY r.start_time DESC
 LIMIT 50;
\endif
DO $$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad FROM cron.job
   WHERE active
     AND COALESCE(nodename, '') NOT IN ('localhost', '127.0.0.1', '::1', '');
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'WARN: % cron job(s) ativo(s) com nodename nao-local. Corrigir com UPDATE cron.job SET nodename=''localhost'' apos failover.', v_bad;
  END IF;
END $$;
\echo 'OK cron jobs apontam para o no local.'
\else
\echo 'NOTICE: SKIP pg_cron nao instalado (cron.job ausente).'
\endif
