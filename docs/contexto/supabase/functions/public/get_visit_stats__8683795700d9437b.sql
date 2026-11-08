CREATE OR REPLACE FUNCTION public.get_visit_stats(p_user_id uuid DEFAULT NULL::uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'total_scheduled', COUNT(*),
      'completed', COUNT(*) FILTER (WHERE status = 'completed'),
      'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
      'pending', COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed', 'rescheduled') AND visit_date >= NOW()),
      'overdue', COUNT(*) FILTER (WHERE status IN ('scheduled', 'confirmed') AND visit_date < NOW()),
      'completion_rate', ROUND(
        COUNT(*) FILTER (WHERE status = 'completed')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'cancelled')), 0) * 100, 2
      ),
      'by_type', (
        SELECT COALESCE(jsonb_object_agg(visit_type, cnt), '{}'::jsonb)
        FROM (SELECT visit_type, COUNT(*) as cnt FROM scheduled_visits WHERE created_at >= NOW() - (p_days || ' days')::interval AND (p_user_id IS NULL OR user_id = p_user_id) GROUP BY visit_type) t
      )
    )
    FROM scheduled_visits
    WHERE created_at >= NOW() - (p_days || ' days')::interval
      AND (p_user_id IS NULL OR user_id = p_user_id)
  );
EXCEPTION WHEN undefined_table THEN
  RETURN jsonb_build_object('total_scheduled', 0);
END;
$function$
