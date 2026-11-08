CREATE OR REPLACE FUNCTION zapp_history.get_contacts_with_activity(p_date date, p_timezone text DEFAULT 'America/Sao_Paulo'::text)
 RETURNS TABLE(contact_id uuid, message_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
BEGIN
  v_start := (p_date::TEXT || ' 00:00:00')::TIMESTAMP AT TIME ZONE p_timezone;
  v_end := (p_date::TEXT || ' 23:59:59.999')::TIMESTAMP AT TIME ZONE p_timezone;

  RETURN QUERY
  SELECT m.contact_id, COUNT(*)::BIGINT
  FROM zapp_history.messages m
  WHERE m.created_at >= v_start AND m.created_at <= v_end
  GROUP BY m.contact_id
  HAVING COUNT(*) > 0;
END;
$function$
