CREATE OR REPLACE FUNCTION public.get_pending_duplicates(p_entity_type text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, entity_type text, entity_1_id uuid, entity_1_name text, entity_2_id uuid, entity_2_name text, similarity_score numeric, match_fields text[])
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    dc.id,
    dc.entity_type::text,
    dc.entity_1_id,
    CASE dc.entity_type 
      WHEN 'company' THEN (SELECT COALESCE(nome_fantasia, nome_crm) FROM companies WHERE id = dc.entity_1_id)
      WHEN 'contact' THEN (SELECT COALESCE(full_name, first_name) FROM contacts WHERE id = dc.entity_1_id)
    END::text as entity_1_name,
    dc.entity_2_id,
    CASE dc.entity_type 
      WHEN 'company' THEN (SELECT COALESCE(nome_fantasia, nome_crm) FROM companies WHERE id = dc.entity_2_id)
      WHEN 'contact' THEN (SELECT COALESCE(full_name, first_name) FROM contacts WHERE id = dc.entity_2_id)
    END::text as entity_2_name,
    dc.similarity_score,
    dc.match_fields
  FROM duplicate_candidates dc
  WHERE dc.status = 'pending'
    AND (p_entity_type IS NULL OR dc.entity_type = p_entity_type)
  ORDER BY dc.similarity_score DESC
  LIMIT p_limit;
END;
$function$
