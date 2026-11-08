CREATE OR REPLACE FUNCTION zapp_history.rollback_v6_enforcement()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'pg_temp'
AS $function$
BEGIN
  UPDATE zapp_history.runtime_config SET value='false' WHERE key='WEBHOOK_SECRET_ENFORCE';
  RETURN 'v6 enforcement DESATIVADO (rollback) em ' || NOW()::TEXT;
END;
$function$
