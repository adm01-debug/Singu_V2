
-- Política INSERT em system_alerts para admin (pré-requisito do INVOKER)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='system_alerts'
      AND policyname='Admins can insert system alerts'
  ) THEN
    CREATE POLICY "Admins can insert system alerts"
      ON public.system_alerts
      FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

ALTER FUNCTION public.increment_webhook_quota(uuid) SECURITY INVOKER;
ALTER FUNCTION public.move_deal_atomic(uuid, text, integer) SECURITY INVOKER;
ALTER FUNCTION public.move_deal_atomic(uuid, text, numeric) SECURITY INVOKER;
ALTER FUNCTION public.publish_mtta_sla_breach_alert(integer, integer) SECURITY INVOKER;
ALTER FUNCTION public.reset_daily_lead_counts() SECURITY INVOKER;
