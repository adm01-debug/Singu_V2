CREATE OR REPLACE FUNCTION public.log_deal_forecast_category_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO public.forecast_categories_history (user_id, deal_forecast_id, from_category, to_category, changed_by, reason)
    VALUES (NEW.user_id, NEW.id, OLD.category, NEW.category, 'user', NEW.notes);
  END IF;
  RETURN NEW;
END;
$function$
