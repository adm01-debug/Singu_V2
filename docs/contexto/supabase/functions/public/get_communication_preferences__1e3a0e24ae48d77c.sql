CREATE OR REPLACE FUNCTION public.get_communication_preferences(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_preferred_channel text;
  v_best_time int;
  v_response_rates jsonb;
BEGIN
  SELECT channel INTO v_preferred_channel
  FROM interactions
  WHERE company_id = p_company_id AND sentiment = 'positive' AND channel IS NOT NULL
  GROUP BY channel
  ORDER BY COUNT(*) DESC
  LIMIT 1;
  
  SELECT MODE() WITHIN GROUP (ORDER BY EXTRACT(HOUR FROM data_interacao)::int) INTO v_best_time
  FROM interactions
  WHERE company_id = p_company_id AND sentiment IN ('positive', 'neutral');
  
  SELECT jsonb_object_agg(channel, rate) INTO v_response_rates
  FROM (
    SELECT 
      channel,
      ROUND(COUNT(*) FILTER (WHERE metadata->>'direction' = 'inbound')::numeric / NULLIF(COUNT(*), 0) * 100, 2) as rate
    FROM interactions
    WHERE company_id = p_company_id AND channel IS NOT NULL
    GROUP BY channel
  ) t;
  
  RETURN jsonb_build_object(
    'preferred_channel', COALESCE(v_preferred_channel, 'phone'),
    'best_contact_hour', COALESCE(v_best_time, 10),
    'response_rates_by_channel', COALESCE(v_response_rates, '{}'::jsonb),
    'total_interactions', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
    'channels_used', (SELECT COALESCE(array_agg(DISTINCT channel), ARRAY[]::text[]) FROM interactions WHERE company_id = p_company_id AND channel IS NOT NULL)
  );
END;
$function$
