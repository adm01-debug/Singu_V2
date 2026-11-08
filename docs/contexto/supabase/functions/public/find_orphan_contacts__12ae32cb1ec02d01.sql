CREATE OR REPLACE FUNCTION public.find_orphan_contacts()
 RETURNS TABLE(contact_id uuid, name text, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT id, COALESCE(full_name, first_name), created_at
  FROM contacts WHERE company_id IS NULL AND deleted_at IS NULL
  ORDER BY created_at DESC;
$function$
