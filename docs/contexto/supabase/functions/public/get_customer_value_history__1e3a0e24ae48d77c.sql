CREATE OR REPLACE FUNCTION public.get_customer_value_history(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'empresa', (SELECT nome_crm FROM companies WHERE id = p_company_id),
    'cliente', (SELECT row_to_json(cu) FROM customers cu WHERE cu.company_id = p_company_id AND cu.deleted_at IS NULL LIMIT 1),
    'total_interacoes', (SELECT COUNT(*) FROM interactions WHERE company_id = p_company_id),
    'primeira_interacao', (SELECT MIN(created_at) FROM interactions WHERE company_id = p_company_id),
    'ultima_interacao', (SELECT MAX(created_at) FROM interactions WHERE company_id = p_company_id),
    'tempo_relacionamento_dias', (SELECT EXTRACT(DAY FROM now() - MIN(created_at))::int FROM interactions WHERE company_id = p_company_id)
  ) INTO result;
  
  RETURN result;
END;
$function$
