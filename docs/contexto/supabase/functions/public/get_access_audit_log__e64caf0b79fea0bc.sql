CREATE OR REPLACE FUNCTION public.get_access_audit_log(p_user_id uuid DEFAULT NULL::uuid, p_entity_type text DEFAULT NULL::text, p_days integer DEFAULT 30, p_limit integer DEFAULT 50)
 RETURNS TABLE(log_id uuid, user_id uuid, user_name text, action text, entity_type text, entity_id text, entity_name text, ip_address text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    al.id as log_id,
    al.user_id,
    pr.full_name::text as user_name,
    al.action::text,
    al.table_name::text as entity_type,
    al.record_id::text as entity_id,
    CASE 
      WHEN al.table_name = 'companies' THEN (SELECT COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social) FROM companies c WHERE c.id::text = al.record_id)
      WHEN al.table_name = 'contacts' THEN (SELECT COALESCE(ct.full_name, ct.first_name) FROM contacts ct WHERE ct.id::text = al.record_id)
      ELSE NULL
    END::text as entity_name,
    al.ip_address::text,
    al.created_at
  FROM audit_log al
  LEFT JOIN profiles pr ON pr.id = al.user_id
  WHERE al.created_at >= NOW() - (p_days || ' days')::interval
    AND (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_entity_type IS NULL OR al.table_name = p_entity_type)
  ORDER BY al.created_at DESC
  LIMIT p_limit;
END;
$function$
