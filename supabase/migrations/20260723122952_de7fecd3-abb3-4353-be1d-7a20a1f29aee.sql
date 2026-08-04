
ALTER FUNCTION public.dismiss_revops_alert(uuid) SECURITY INVOKER;
ALTER FUNCTION public.compute_attribution(text, text, numeric) SECURITY INVOKER;
ALTER FUNCTION public.enroll_contact_in_workflow(uuid, uuid) SECURITY INVOKER;
ALTER FUNCTION public.get_connection_metrics(uuid) SECURITY INVOKER;

-- Reforçar guard em enroll_contact_in_workflow: garantir auth.uid() válido
CREATE OR REPLACE FUNCTION public.enroll_contact_in_workflow(_workflow_id uuid, _contact_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  INSERT INTO public.nurturing_executions (user_id, workflow_id, contact_id, status, next_action_at)
  VALUES (auth.uid(), _workflow_id, _contact_id, 'active', now())
  ON CONFLICT (workflow_id, contact_id) DO UPDATE
    SET status = 'active', next_action_at = COALESCE(public.nurturing_executions.next_action_at, now())
  RETURNING id INTO _id;

  UPDATE public.nurturing_workflows SET enrolled_count = enrolled_count + 1 WHERE id = _workflow_id;

  RETURN _id;
END;
$function$;
