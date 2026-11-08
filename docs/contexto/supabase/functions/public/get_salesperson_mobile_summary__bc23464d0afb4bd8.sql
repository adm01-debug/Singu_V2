CREATE OR REPLACE FUNCTION public.get_salesperson_mobile_summary(p_vendedor_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'hoje', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at::date = CURRENT_DATE),
      'empresas', (SELECT COUNT(DISTINCT company_id) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND created_at::date = CURRENT_DATE)
    ),
    'pendencias', jsonb_build_object(
      'followups', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND followup_pendente = true),
      'atrasados', (SELECT COUNT(*) FROM interactions WHERE usuario_responsavel_id = p_vendedor_id AND followup_pendente = true AND data_followup < now())
    ),
    'carteira', jsonb_build_object(
      'clientes', (SELECT COUNT(*) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL),
      'valor', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE vendedor_id = p_vendedor_id AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
