CREATE OR REPLACE FUNCTION zapp_history.get_runtime_secret(p_key text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'pg_temp'
AS $function$
DECLARE v_value TEXT;
BEGIN
  SELECT value INTO v_value FROM zapp_history.runtime_config WHERE key = p_key;
  RETURN v_value;
END;
$function$
