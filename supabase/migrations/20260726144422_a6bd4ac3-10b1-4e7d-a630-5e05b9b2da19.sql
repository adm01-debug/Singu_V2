SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'capture-degraded-rpc-plans';

SELECT cron.schedule(
  'capture-degraded-rpc-plans',
  '*/15 * * * *',
  $$SELECT public.capture_degraded_rpc_plans();$$
);
