CREATE OR REPLACE FUNCTION public.get_segment_companies(p_segment_id uuid, p_limit integer DEFAULT 100, p_offset integer DEFAULT 0)
 RETURNS TABLE(company_id uuid, company_name text, lead_score integer, last_interaction timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_segment smart_segments%ROWTYPE;
BEGIN
  SELECT * INTO v_segment FROM smart_segments WHERE id = p_segment_id;
  IF NOT FOUND THEN RETURN; END IF;
  
  RETURN QUERY
  SELECT 
    c.id,
    COALESCE(c.nome_fantasia, c.nome_crm)::text,
    COALESCE(c.lead_score, 0)::int,
    (SELECT MAX(data_interacao) FROM interactions i WHERE i.company_id = c.id)
  FROM companies c
  WHERE c.deleted_at IS NULL
  ORDER BY c.lead_score DESC NULLS LAST
  LIMIT p_limit OFFSET p_offset;
END;
$function$
