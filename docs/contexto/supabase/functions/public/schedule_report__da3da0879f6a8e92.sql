CREATE OR REPLACE FUNCTION public.schedule_report(p_report_type text, p_params jsonb, p_schedule text, p_recipients uuid[], p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_report_id uuid := gen_random_uuid();
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Insere configuração de relatório agendado (tabela hipotética scheduled_reports)
  -- Por enquanto, registra como metadata em audit_log
  INSERT INTO audit_log (table_name, record_id, action, new_data, user_id)
  VALUES (
    'scheduled_reports',
    v_report_id::text,
    'INSERT',
    jsonb_build_object(
      'report_type', p_report_type,
      'params', p_params,
      'schedule', p_schedule,
      'recipients', p_recipients,
      'created_by', p_user_id,
      'created_at', NOW()
    ),
    p_user_id
  );
  
  RETURN v_report_id;
END;
$function$
