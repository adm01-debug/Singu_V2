CREATE OR REPLACE FUNCTION public.unified_search(p_query text, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'query', p_query,
    'companies', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', COALESCE(nome_fantasia, nome_crm), 'cnpj', cnpj)), '[]'::jsonb)
      FROM (SELECT id, nome_fantasia, nome_crm, cnpj FROM companies WHERE deleted_at IS NULL AND (nome_fantasia ILIKE '%' || p_query || '%' OR cnpj ILIKE '%' || p_query || '%') LIMIT p_limit) sub),
    'contacts', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', COALESCE(full_name, first_name))), '[]'::jsonb)
      FROM (SELECT id, full_name, first_name FROM contacts WHERE deleted_at IS NULL AND full_name ILIKE '%' || p_query || '%' LIMIT p_limit) sub),
    'deals', (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', titulo, 'value', valor)), '[]'::jsonb)
      FROM (SELECT id, titulo, valor FROM deals WHERE titulo ILIKE '%' || p_query || '%' LIMIT p_limit) sub)
  );
END;
$function$
