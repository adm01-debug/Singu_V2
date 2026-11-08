CREATE OR REPLACE FUNCTION public.count_unread_notifications(p_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::int FROM notifications WHERE user_id = p_user_id AND is_read = false;
$function$
