CREATE OR REPLACE FUNCTION public.get_orphan_contacts(p_limit integer DEFAULT 100)
 RETURNS TABLE(contact_id uuid, nome text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id as contact_id,
    COALESCE(ct.full_name, ct.first_name)::text as nome,
    ct.created_at
  FROM contacts ct
  WHERE ct.company_id IS NULL 
    AND ct.deleted_at IS NULL
  ORDER BY ct.created_at DESC
  LIMIT p_limit;
END;
$function$
