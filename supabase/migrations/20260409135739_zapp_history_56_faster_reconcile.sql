-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409135739
-- nome:   zapp_history_56_faster_reconcile

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
