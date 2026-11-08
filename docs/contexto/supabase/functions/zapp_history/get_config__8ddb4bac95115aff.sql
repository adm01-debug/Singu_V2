CREATE OR REPLACE FUNCTION zapp_history.get_config(p_key text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_value TEXT;
BEGIN
  -- Tenta runtime_config primeiro
  SELECT value INTO v_value FROM zapp_history.runtime_config WHERE key = p_key;
  IF v_value IS NOT NULL AND v_value <> 'PENDING_MANUAL_INSERT' THEN
    RETURN v_value;
  END IF;

  -- Fallback: GUC
  v_value := current_setting('app.' || p_key, true);
  IF v_value IS NOT NULL AND v_value <> '' THEN
    RETURN v_value;
  END IF;

  RETURN NULL;
END;
$function$
