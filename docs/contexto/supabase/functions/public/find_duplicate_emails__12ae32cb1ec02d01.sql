CREATE OR REPLACE FUNCTION public.find_duplicate_emails()
 RETURNS TABLE(email text, count bigint, contact_ids uuid[])
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT ce.email, COUNT(DISTINCT ce.contact_id), ARRAY_AGG(DISTINCT ce.contact_id)
  FROM contact_emails ce JOIN contacts c ON c.id = ce.contact_id AND c.deleted_at IS NULL
  WHERE ce.email IS NOT NULL AND ce.email != ''
  GROUP BY ce.email HAVING COUNT(DISTINCT ce.contact_id) > 1
  ORDER BY 2 DESC;
$function$
