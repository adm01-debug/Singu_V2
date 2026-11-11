-- Reagenda 5 rotinas SQL que existiam nas migrations (padrão unschedule→schedule) mas não estão em
-- cron.job neste projeto; as funções/tabelas que elas usam existem. Comandos idênticos aos originais.
-- apply-data-retention-daily e revalidate-stale-phones ficam de fora: apply_retention_policies e
-- phone_verifications não existem aqui.
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname IN (
  'check-contact-health-daily', 'mtta-sla-breach-auto-ack-hourly', 'mtta-auto-ack-heartbeat-watchdog',
  'cleanup-simulated-alerts-weekly', 'revalidate-stale-emails');

SELECT cron.schedule('check-contact-health-daily', '0 0 * * *', $c$SELECT public.check_contact_health_alerts()$c$);
SELECT cron.schedule('mtta-sla-breach-auto-ack-hourly', '7 * * * *', $c$SELECT public.auto_ack_stale_mtta_sla_breaches();$c$);
SELECT cron.schedule('mtta-auto-ack-heartbeat-watchdog', '*/30 * * * *', $c$ SELECT public.check_mtta_auto_ack_heartbeat(); $c$);
SELECT cron.schedule('cleanup-simulated-alerts-weekly', '0 3 * * 0', $c$ SELECT public.cleanup_simulated_alerts(); $c$);
SELECT cron.schedule('revalidate-stale-emails', '0 4 * * *', $c$
  INSERT INTO public.validation_queue (user_id, contact_id, kind, value)
  SELECT DISTINCT ev.user_id, ev.contact_id, 'email'::public.validation_kind, ev.email
  FROM public.email_verifications ev
  WHERE ev.verified_at < now() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.validation_queue vq
      WHERE vq.user_id = ev.user_id AND vq.value = ev.email AND vq.kind = 'email'
        AND vq.status IN ('pending','processing')
    )
  LIMIT 500
$c$);

-- nurturing-runner chama este RPC ao concluir um workflow; ele nunca foi criado.
CREATE OR REPLACE FUNCTION public.increment_workflow_completed(_id uuid)
RETURNS void
LANGUAGE sql
SET search_path = ''
AS $f$
  UPDATE public.nurturing_workflows
     SET completed_count = coalesce(completed_count, 0) + 1, updated_at = now()
   WHERE id = _id;
$f$;
REVOKE ALL ON FUNCTION public.increment_workflow_completed(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_workflow_completed(uuid) TO service_role;
