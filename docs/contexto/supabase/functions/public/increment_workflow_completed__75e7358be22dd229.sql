CREATE OR REPLACE FUNCTION public.increment_workflow_completed(_id uuid)
 RETURNS void
 LANGUAGE sql
 SET search_path TO ''
AS $function$
  UPDATE public.nurturing_workflows
     SET completed_count = coalesce(completed_count, 0) + 1, updated_at = now()
   WHERE id = _id;
$function$
