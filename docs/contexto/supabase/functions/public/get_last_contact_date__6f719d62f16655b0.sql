CREATE OR REPLACE FUNCTION public.get_last_contact_date(p_company_id uuid, p_channel text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'last_any_channel', (
      SELECT MAX(created_at) FROM interactions WHERE company_id = p_company_id
    ),
    'last_inbound', (
      SELECT MAX(created_at) FROM interactions 
      WHERE company_id = p_company_id AND direction = 'inbound'
    ),
    'last_outbound', (
      SELECT MAX(created_at) FROM interactions 
      WHERE company_id = p_company_id AND direction = 'outbound'
    ),
    'by_channel', (
      SELECT jsonb_object_agg(channel, last_date)
      FROM (
        SELECT channel, MAX(created_at) as last_date
        FROM interactions
        WHERE company_id = p_company_id
        GROUP BY channel
      ) sub
    ),
    'days_since_contact', (
      SELECT EXTRACT(DAY FROM NOW() - MAX(created_at))::INT
      FROM interactions WHERE company_id = p_company_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
