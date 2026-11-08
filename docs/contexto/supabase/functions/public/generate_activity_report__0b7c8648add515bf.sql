CREATE OR REPLACE FUNCTION public.generate_activity_report(p_start_date date DEFAULT (CURRENT_DATE - 30), p_end_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'period', jsonb_build_object('start', p_start_date, 'end', p_end_date),
    'interactions', jsonb_build_object(
      'total', COUNT(*),
      'by_type', (SELECT jsonb_object_agg(type, cnt) FROM (SELECT type, COUNT(*) as cnt FROM interactions WHERE data_interacao::date BETWEEN p_start_date AND p_end_date GROUP BY type) t),
      'by_channel', (SELECT jsonb_object_agg(channel, cnt) FROM (SELECT channel, COUNT(*) as cnt FROM interactions WHERE data_interacao::date BETWEEN p_start_date AND p_end_date GROUP BY channel) t),
      'avg_per_day', ROUND(COUNT(*)::numeric / NULLIF(p_end_date - p_start_date + 1, 0), 1)
    ),
    'new_companies', (SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN p_start_date AND p_end_date AND deleted_at IS NULL),
    'new_contacts', (SELECT COUNT(*) FROM contacts WHERE created_at::date BETWEEN p_start_date AND p_end_date),
    'tasks_completed', (SELECT COUNT(*) FROM tasks WHERE completed_at::date BETWEEN p_start_date AND p_end_date),
    'generated_at', NOW()
  ) INTO v_result
  FROM interactions
  WHERE data_interacao::date BETWEEN p_start_date AND p_end_date;
  
  RETURN v_result;
END;
$function$
