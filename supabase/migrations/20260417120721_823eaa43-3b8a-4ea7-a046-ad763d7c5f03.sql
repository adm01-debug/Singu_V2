-- Garante extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Limpa jobs antigos com mesmo nome
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT jobid FROM cron.job WHERE jobname IN ('validation-queue-drain','revalidate-stale-emails','revalidate-stale-phones') LOOP
    PERFORM cron.unschedule(r.jobid);
  END LOOP;
END $$;

SELECT cron.schedule(
  'validation-queue-drain',
  '*/5 * * * *',
  $$ SELECT net.http_post(
    url := 'https://rqodmqosrotmtrjnnjul.supabase.co/functions/v1/validation-queue-worker',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxb2RtcW9zcm90bXRyam5uanVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MTY0MTksImV4cCI6MjA4MzQ5MjQxOX0.OIdurq23Z-VGg59MUAtX-UXR-zkwo-fYnPtskQQPlYo"}'::jsonb,
    body := '{}'::jsonb
  ) $$
);

SELECT cron.schedule(
  'revalidate-stale-emails',
  '0 4 * * *',
  $$
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
  $$
);

SELECT cron.schedule(
  'revalidate-stale-phones',
  '30 4 * * *',
  $$
  INSERT INTO public.validation_queue (user_id, contact_id, kind, value)
  SELECT DISTINCT pv.user_id, pv.contact_id, 'phone'::public.validation_kind, pv.phone_input
  FROM public.phone_validations pv
  WHERE pv.validated_at < now() - INTERVAL '90 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.validation_queue vq
      WHERE vq.user_id = pv.user_id AND vq.value = pv.phone_input AND vq.kind = 'phone'
        AND vq.status IN ('pending','processing')
    )
  LIMIT 500
  $$
);