CREATE OR REPLACE FUNCTION zapp_history.trg_set_has_media()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
BEGIN
  UPDATE zapp_history.messages SET has_media = TRUE WHERE id = NEW.message_id;
  RETURN NEW;
END;
$function$
