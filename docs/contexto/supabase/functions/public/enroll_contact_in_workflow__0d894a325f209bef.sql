CREATE OR REPLACE FUNCTION public.enroll_contact_in_workflow(_workflow_id uuid, _contact_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _id UUID;
  _inserted BOOLEAN;
BEGIN
  IF auth.uid() IS NULL
     OR NOT EXISTS (SELECT 1 FROM public.nurturing_workflows WHERE id = _workflow_id AND user_id = auth.uid())
     OR NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = _contact_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  INSERT INTO public.nurturing_executions (user_id, workflow_id, contact_id, status, next_action_at)
  VALUES (auth.uid(), _workflow_id, _contact_id, 'active', now())
  ON CONFLICT (workflow_id, contact_id) DO UPDATE
    SET status = 'active', next_action_at = COALESCE(public.nurturing_executions.next_action_at, now())
  RETURNING id, (xmax = 0) INTO _id, _inserted;

  IF _inserted THEN
    UPDATE public.nurturing_workflows
       SET total_enrolled = COALESCE(total_enrolled, 0) + 1
     WHERE id = _workflow_id;
  END IF;

  RETURN _id;
END;
$function$
