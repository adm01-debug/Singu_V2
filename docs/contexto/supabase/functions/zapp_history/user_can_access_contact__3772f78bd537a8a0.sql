CREATE OR REPLACE FUNCTION zapp_history.user_can_access_contact(p_contact_id uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'zapp_history', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = p_contact_id
      AND c.deleted_at IS NULL
      AND (
        c.user_id = p_user_id
        OR EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = p_user_id)
      )
  );
$function$
