CREATE OR REPLACE FUNCTION public.global_search_v2(p_query text, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_companies jsonb;
  v_contacts jsonb;
  v_interactions jsonb;
BEGIN
  -- Busca empresas
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', 'company',
    'id', id,
    'name', COALESCE(nome_fantasia, nome_crm, razao_social),
    'cnpj', cnpj,
    'status', status
  )), '[]'::jsonb) INTO v_companies
  FROM companies
  WHERE (COALESCE(nome_fantasia, nome_crm) ILIKE '%' || p_query || '%'
     OR razao_social ILIKE '%' || p_query || '%'
     OR cnpj ILIKE '%' || p_query || '%'
     OR website ILIKE '%' || p_query || '%')
    AND deleted_at IS NULL
  LIMIT p_limit;
  
  -- Busca contatos (usando full_name ao invés de name)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', 'contact',
    'id', ct.id,
    'name', COALESCE(ct.full_name, ct.first_name || ' ' || ct.last_name),
    'company_id', ct.company_id,
    'company_name', COALESCE(c.nome_fantasia, c.nome_crm, c.razao_social)
  )), '[]'::jsonb) INTO v_contacts
  FROM contacts ct
  JOIN companies c ON c.id = ct.company_id
  WHERE (ct.full_name ILIKE '%' || p_query || '%'
     OR ct.first_name ILIKE '%' || p_query || '%'
     OR ct.last_name ILIKE '%' || p_query || '%')
    AND ct.deleted_at IS NULL
  LIMIT p_limit;
  
  -- Busca interações
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'type', 'interaction',
    'id', i.id,
    'notes', LEFT(COALESCE(i.resumo, i.content), 100),
    'date', i.data_interacao,
    'company_id', i.company_id
  )), '[]'::jsonb) INTO v_interactions
  FROM interactions i
  WHERE COALESCE(i.resumo, i.content) ILIKE '%' || p_query || '%'
  LIMIT p_limit;
  
  RETURN jsonb_build_object(
    'companies', v_companies,
    'contacts', v_contacts,
    'interactions', v_interactions,
    'total', jsonb_array_length(v_companies) + jsonb_array_length(v_contacts) + jsonb_array_length(v_interactions),
    'query', p_query
  );
END;
$function$
