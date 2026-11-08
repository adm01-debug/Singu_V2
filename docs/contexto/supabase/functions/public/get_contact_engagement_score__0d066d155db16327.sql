CREATE OR REPLACE FUNCTION public.get_contact_engagement_score(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_interactions_30d int;
  v_interactions_90d int;
  v_response_rate numeric;
  v_preferred_channel text;
  v_score int;
BEGIN
  SELECT COUNT(*) FILTER (WHERE data_interacao >= NOW() - INTERVAL '30 days'),
         COUNT(*) FILTER (WHERE data_interacao >= NOW() - INTERVAL '90 days')
  INTO v_interactions_30d, v_interactions_90d
  FROM interactions WHERE contact_id = p_contact_id;
  
  -- Taxa de resposta (inbound vs total)
  SELECT CASE WHEN COUNT(*) > 0 
    THEN ROUND((COUNT(*) FILTER (WHERE direction = 'inbound')::numeric / COUNT(*)) * 100, 2)
    ELSE 0 END
  INTO v_response_rate
  FROM interactions WHERE contact_id = p_contact_id AND data_interacao >= NOW() - INTERVAL '90 days';
  
  -- Canal preferido
  SELECT type INTO v_preferred_channel
  FROM interactions WHERE contact_id = p_contact_id
  GROUP BY type ORDER BY COUNT(*) DESC LIMIT 1;
  
  -- Score
  v_score := LEAST(v_interactions_30d * 10, 40) + LEAST(v_interactions_90d * 2, 20) + (v_response_rate * 0.4)::int;

  v_result := jsonb_build_object(
    'contact_id', p_contact_id,
    'engagement_score', v_score,
    'interactions_30d', v_interactions_30d,
    'interactions_90d', v_interactions_90d,
    'response_rate', v_response_rate,
    'preferred_channel', v_preferred_channel,
    'calculated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
