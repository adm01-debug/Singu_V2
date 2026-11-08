CREATE OR REPLACE FUNCTION public.segment_companies_for_campaign(p_segment jsonb)
 RETURNS TABLE(id uuid, trade_name text, segment text, state text, email text, phone text, salesperson text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
  v_segment text;
  v_min_interactions int;
BEGIN
  v_status := COALESCE(p_segment->>'status', 'ativo');
  v_segment := p_segment->>'segment';
  v_min_interactions := COALESCE((p_segment->>'min_interactions')::int, 0);
  
  RETURN QUERY
  SELECT 
    c.id, 
    COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)::text as trade_name, 
    c.ramo_atividade::text as segment, 
    (SELECT ca.estado::text FROM company_addresses ca WHERE ca.company_id = c.id AND ca.is_primary LIMIT 1) as state,
    (SELECT ce.email::text FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary LIMIT 1) as email,
    (SELECT cp.numero::text FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary LIMIT 1) as phone,
    pr.full_name::text as salesperson
  FROM companies c
  LEFT JOIN profiles pr ON pr.id = c.user_id
  WHERE c.status::text = v_status
    AND c.deleted_at IS NULL
    AND (v_segment IS NULL OR c.ramo_atividade ILIKE '%' || v_segment || '%')
    AND (v_min_interactions = 0 OR (
      SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id
    ) >= v_min_interactions)
  ORDER BY COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)
  LIMIT 1000;
END;
$function$
