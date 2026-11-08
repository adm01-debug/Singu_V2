CREATE OR REPLACE FUNCTION public.get_team_member_ids(_manager_user_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT array_agg(stm.user_id)
  FROM public.sales_team_members stm
  WHERE stm.manager_id IN (
    SELECT id FROM public.sales_team_members WHERE user_id = _manager_user_id
  )
  OR stm.user_id = _manager_user_id;
$function$
