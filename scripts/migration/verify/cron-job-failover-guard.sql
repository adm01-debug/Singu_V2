-- cron-job-failover-guard.sql — Rodada 19/10
-- pg_cron amarra jobs a nodename; failover regional pode deixar jobs orfaos.
\echo '== cron-job-failover-guard =='
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname='pg_cron') THEN
    RAISE NOTICE 'pg_cron nao instalado; skip.';
    RETURN;
  END IF;
END $$;
SELECT jobid, jobname, schedule, nodename, nodeport, database, username, active
  FROM cron.job
 ORDER BY jobid;
\echo '-- Jobs com falhas recentes (ultimos 7 dias) --'
SELECT j.jobname, r.status, r.return_message, r.start_time
  FROM cron.job_run_details r
  JOIN cron.job j ON j.jobid = r.jobid
 WHERE r.start_time > now() - interval '7 days'
   AND r.status <> 'succeeded'
 ORDER BY r.start_time DESC
 LIMIT 50;
\echo 'REC: jobs devem ter nodename=localhost; corrigir com UPDATE cron.job apos failover.'