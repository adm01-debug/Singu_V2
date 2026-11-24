CREATE OR REPLACE FUNCTION public.get_health_check()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ BEGIN RETURN '{"status":"ok"}'::json; END; $function$
