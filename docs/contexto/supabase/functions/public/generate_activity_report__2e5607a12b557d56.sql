CREATE OR REPLACE FUNCTION public.generate_activity_report(p_start_date date, p_end_date date, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
  v_by_type jsonb;
  v_by_channel jsonb;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_object_agg(type, cnt) INTO v_by_type
  FROM (
    SELECT type, COUNT(*) as cnt FROM interactions
    WHERE data_interacao::date BETWEEN p_start_date AND p_end_date
      AND (p_user_id IS NULL OR user_id = p_user_id)
    GROUP BY type
  ) t;
  
  SELECT jsonb_object_agg(channel, cnt) INTO v_by_channel
  FROM (
    SELECT channel, COUNT(*) as cnt FROM interactions
    WHERE data_interacao::date BETWEEN p_start_date AND p_end_date
      AND (p_user_id IS NULL OR user_id = p_user_id)
    GROUP BY channel
  ) t;

  v_result := jsonb_build_object(
    'period', jsonb_build_object('start', p_start_date, 'end', p_end_date),
    'total_interactions', (SELECT COUNT(*) FROM interactions WHERE data_interacao::date BETWEEN p_start_date AND p_end_date AND (p_user_id IS NULL OR user_id = p_user_id)),
    'unique_companies', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE data_interacao::date BETWEEN p_start_date AND p_end_date AND (p_user_id IS NULL OR user_id = p_user_id)),
    'by_type', COALESCE(v_by_type, '{}'::jsonb),
    'by_channel', COALESCE(v_by_channel, '{}'::jsonb),
    'generated_at', NOW()
  );
  
  RETURN v_result;
END;
$function$
