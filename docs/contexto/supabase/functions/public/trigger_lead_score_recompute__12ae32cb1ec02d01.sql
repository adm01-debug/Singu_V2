CREATE OR REPLACE FUNCTION public.trigger_lead_score_recompute()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    INSERT INTO public.lead_score_recompute_queue (user_id, contact_id, reason)
    SELECT NEW.user_id, NEW.contact_id, 'intent_signal'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lead_score_recompute_queue
      WHERE user_id = NEW.user_id
        AND contact_id = NEW.contact_id
        AND processed_at IS NULL
    );
  END IF;
  RETURN NEW;
END;
$function$
