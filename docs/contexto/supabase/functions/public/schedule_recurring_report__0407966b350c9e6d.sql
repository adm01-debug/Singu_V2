CREATE OR REPLACE FUNCTION public.schedule_recurring_report(p_name text, p_report_type text, p_schedule_cron text, p_recipients text[], p_parameters jsonb DEFAULT '{}'::jsonb, p_format text DEFAULT 'pdf'::text, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_id uuid;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  INSERT INTO scheduled_reports (name, report_type, parameters, schedule_cron, recipients, format, created_by, next_run_at)
  VALUES (p_name, p_report_type, p_parameters, p_schedule_cron, p_recipients, p_format, p_user_id, NOW() + INTERVAL '1 day')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
