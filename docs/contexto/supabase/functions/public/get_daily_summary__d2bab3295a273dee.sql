CREATE OR REPLACE FUNCTION public.get_daily_summary(p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT public.get_daily_summary(p_date, current_setting('TimeZone'));
$function$
