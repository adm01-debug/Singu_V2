-- Cron a cada 30 segundos via 2 jobs intercalados
-- (pg_cron tem granularidade mínima de 1 min, então uso 2 jobs com offset)
SELECT cron.unschedule('zapp-reconcile-nlp');

SELECT cron.schedule(
  'zapp-reconcile-nlp',
  '* * * * *',
  $$ SELECT zapp_history.reconcile_nlp_responses() $$
);

-- Job auxiliar: a cada minuto, espera 30s e roda
SELECT cron.schedule(
  'zapp-reconcile-nlp-30s',
  '* * * * *',
  $$ SELECT pg_sleep(30); SELECT zapp_history.reconcile_nlp_responses(); $$
);
