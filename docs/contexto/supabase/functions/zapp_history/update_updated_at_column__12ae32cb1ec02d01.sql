CREATE OR REPLACE FUNCTION zapp_history.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$function$
