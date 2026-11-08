CREATE OR REPLACE FUNCTION zapp_history.refresh_contact_stats()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY zapp_history.contact_message_stats;
END;
$function$
