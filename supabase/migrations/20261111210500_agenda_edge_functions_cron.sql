-- Agenda as edge functions periódicas do Singu (protegidas por x-cron-secret).
-- O segredo NÃO fica aqui: é lido do Vault ('singu_cron_secret'), que deve ter o mesmo valor do
-- edge secret CRON_SECRET. Sem o item no Vault a chamada sai com header vazio e a função responde 401.
-- Horários em UTC (BRT = UTC-3). Idempotente: remove o job homônimo antes de recriar.
--
-- Fora daqui de propósito:
--   smart-notify (falta EVOLUTION_API_*), connection-anomaly-detector / auto-rebatch-behavioral /
--   auto-regen-behavioral-profiles / process-behavioral-regen-queue (falta LOVABLE_API_KEY),
--   social-events-detector (falta FIRECRAWL_API_KEY);
--   generate-behavioral-profile, retry-behavioral-profile, send-sms-campaign, sync-social-interests
--   são disparadas por evento/usuário, não por relógio.


SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-validation-queue-worker';
SELECT cron.schedule('singu-edge-validation-queue-worker', '*/5 * * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/validation-queue-worker',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-process-webhook-dlq';
SELECT cron.schedule('singu-edge-process-webhook-dlq', '1-59/5 * * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/process-webhook-dlq',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-sequence-processor';
SELECT cron.schedule('singu-edge-sequence-processor', '2-59/5 * * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/sequence-processor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-nurturing-runner';
SELECT cron.schedule('singu-edge-nurturing-runner', '4-59/15 * * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/nurturing-runner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-check-notifications';
SELECT cron.schedule('singu-edge-check-notifications', '7 * * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/check-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-check-health-alerts';
SELECT cron.schedule('singu-edge-check-health-alerts', '17 * * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/check-health-alerts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-mql-evaluator';
SELECT cron.schedule('singu-edge-mql-evaluator', '27 * * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/mql-evaluator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-revops-snapshot-builder';
SELECT cron.schedule('singu-edge-revops-snapshot-builder', '0 4 * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/revops-snapshot-builder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-lead-score-cron';
SELECT cron.schedule('singu-edge-lead-score-cron', '20 5 * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/lead-score-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-cs-health-recalc';
SELECT cron.schedule('singu-edge-cs-health-recalc', '40 5 * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/cs-health-recalc',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-forecast-snapshot-cron';
SELECT cron.schedule('singu-edge-forecast-snapshot-cron', '10 6 * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/forecast-snapshot-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-client-notifications';
SELECT cron.schedule('singu-edge-client-notifications', '3 11 * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/client-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-template-success-notifications';
SELECT cron.schedule('singu-edge-template-success-notifications', '13 12 * * *', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/template-success-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{"checkAll": true}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);

SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'singu-edge-weekly-digest';
SELECT cron.schedule('singu-edge-weekly-digest', '23 11 * * 1', $job$
  SELECT net.http_post(
    url     := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1/weekly-digest',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', coalesce((SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'singu_cron_secret'), '')
    ),
    body    := '{"source": "cron"}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);
