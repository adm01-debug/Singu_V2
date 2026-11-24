CREATE OR REPLACE FUNCTION public.get_health_check()
 RETURNS json
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  SELECT jsonb_build_object(
    'status', 'ok',
    'checks', jsonb_build_object('database', 'ok'),
    'database_name', current_database(),
    'checked_at', clock_timestamp()
  )::json
$function$
