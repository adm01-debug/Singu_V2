CREATE OR REPLACE FUNCTION public.get_automation_stats(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'total_events', (
      SELECT COUNT(*) FROM interactions 
      WHERE type = 'workflow_event' AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    'total_scheduled_tasks', (
      SELECT COUNT(*) FROM interactions 
      WHERE type = 'scheduled_task' AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    'tasks_completed', (
      SELECT COUNT(*) FROM interactions 
      WHERE type = 'scheduled_task' AND status = 'concluido' AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    'tasks_pending', (
      SELECT COUNT(*) FROM interactions 
      WHERE type = 'scheduled_task' AND status IN ('agendado', 'pendente')
    ),
    'events_by_type', (
      SELECT jsonb_object_agg(event_type, cnt)
      FROM (
        SELECT metadata->>'event_type' as event_type, COUNT(*) as cnt
        FROM interactions 
        WHERE type = 'workflow_event' AND created_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY metadata->>'event_type'
      ) sub
    ),
    'daily_breakdown', (
      SELECT jsonb_agg(jsonb_build_object('date', dt, 'events', cnt))
      FROM (
        SELECT created_at::DATE as dt, COUNT(*) as cnt
        FROM interactions 
        WHERE type IN ('workflow_event', 'scheduled_task') AND created_at >= NOW() - (p_days || ' days')::INTERVAL
        GROUP BY created_at::DATE
        ORDER BY created_at::DATE
      ) sub
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
