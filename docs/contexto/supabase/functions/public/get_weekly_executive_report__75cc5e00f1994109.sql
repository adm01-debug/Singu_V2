CREATE OR REPLACE FUNCTION public.get_weekly_executive_report(p_week_offset integer DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_start_date date;
  v_end_date date;
  v_result jsonb;
BEGIN
  v_start_date := date_trunc('week', CURRENT_DATE - (p_week_offset * 7)::interval)::date;
  v_end_date := v_start_date + 6;
  
  SELECT jsonb_build_object(
    'period', jsonb_build_object(
      'week_start', v_start_date,
      'week_end', v_end_date,
      'week_number', EXTRACT(week FROM v_start_date)
    ),
    'companies', jsonb_build_object(
      'new', (SELECT COUNT(*) FROM companies WHERE created_at::date BETWEEN v_start_date AND v_end_date),
      'total_active', (SELECT COUNT(*) FROM companies WHERE status = 'ativo')
    ),
    'interactions', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM interactions WHERE created_at::date BETWEEN v_start_date AND v_end_date),
      'by_type', (
        SELECT COALESCE(jsonb_object_agg(type, cnt), '{}'::jsonb)
        FROM (
          SELECT type, COUNT(*) as cnt 
          FROM interactions 
          WHERE created_at::date BETWEEN v_start_date AND v_end_date
          GROUP BY type
        ) t
      )
    ),
    'contacts', jsonb_build_object(
      'new', (SELECT COUNT(*) FROM contacts WHERE created_at::date BETWEEN v_start_date AND v_end_date)
    ),
    'salespeople', (
      SELECT COALESCE(jsonb_agg(sp ORDER BY interactions DESC), '[]'::jsonb)
      FROM (
        SELECT 
          p.full_name as name,
          COUNT(DISTINCT c.id) as companies,
          COUNT(i.id) as interactions
        FROM profiles p
        LEFT JOIN companies c ON c.user_id = p.id AND c.created_at::date BETWEEN v_start_date AND v_end_date
        LEFT JOIN interactions i ON i.user_id = p.id AND i.created_at::date BETWEEN v_start_date AND v_end_date
        GROUP BY p.id, p.full_name
        HAVING COUNT(i.id) > 0
        LIMIT 10
      ) sp
    ),
    'generated_at', NOW()
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
