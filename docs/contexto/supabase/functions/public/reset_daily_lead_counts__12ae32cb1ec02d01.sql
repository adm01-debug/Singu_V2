CREATE OR REPLACE FUNCTION public.reset_daily_lead_counts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  affected integer;
BEGIN
  UPDATE public.sales_team_members
  SET leads_today = 0, leads_today_reset_at = now()
  WHERE leads_today_reset_at IS NULL 
     OR leads_today_reset_at::date < CURRENT_DATE;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$
