CREATE OR REPLACE FUNCTION public.get_dashboard_data()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ BEGIN RETURN '{}'::json; END; $function$
