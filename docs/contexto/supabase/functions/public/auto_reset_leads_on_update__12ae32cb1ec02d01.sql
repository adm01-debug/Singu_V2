CREATE OR REPLACE FUNCTION public.auto_reset_leads_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.leads_today_reset_at IS NULL OR OLD.leads_today_reset_at::date < CURRENT_DATE THEN
    -- If leads_today is being incremented, reset it first then add 1
    IF NEW.leads_today > OLD.leads_today THEN
      NEW.leads_today := 1;
    ELSE
      NEW.leads_today := 0;
    END IF;
    NEW.leads_today_reset_at := now();
  END IF;
  RETURN NEW;
END;
$function$
