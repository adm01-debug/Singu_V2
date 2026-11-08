CREATE OR REPLACE FUNCTION zapp_history.activate_v6_enforcement()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'pg_temp'
AS $function$
BEGIN
  UPDATE zapp_history.runtime_config SET value='true' WHERE key='WEBHOOK_SECRET_ENFORCE';
  RETURN 'v6 enforcement ATIVADO em ' || NOW()::TEXT;
END;
$function$
