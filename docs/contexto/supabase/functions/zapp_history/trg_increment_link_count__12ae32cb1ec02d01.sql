CREATE OR REPLACE FUNCTION zapp_history.trg_increment_link_count()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
BEGIN
  UPDATE zapp_history.messages
  SET has_links = TRUE,
      link_count = link_count + 1
  WHERE id = NEW.message_id;
  RETURN NEW;
END;
$function$
