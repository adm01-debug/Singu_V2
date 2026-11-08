CREATE OR REPLACE FUNCTION public.process_scheduled_actions(p_batch_size integer DEFAULT 100)
 RETURNS TABLE(task_id uuid, company_id uuid, task_type text, status text)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN QUERY
  WITH due_tasks AS (
    SELECT id, i.company_id, metadata->>'task_type' as ttype
    FROM interactions i
    WHERE i.type = 'scheduled_task'
      AND i.status = 'agendado'
      AND i.data_agendada <= NOW()
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE interactions
    SET status = 'processando', updated_at = NOW()
    WHERE id IN (SELECT id FROM due_tasks)
    RETURNING id
  )
  SELECT dt.id, dt.company_id, dt.ttype, 'processando'::TEXT
  FROM due_tasks dt;
END;
$function$
