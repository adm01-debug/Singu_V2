CREATE OR REPLACE FUNCTION public.get_full_funnel_analysis(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_empresas int;
  empresas_contato int;
  clientes_ativados int;
  clientes_compraram int;
BEGIN
  SELECT COUNT(*) INTO total_empresas FROM companies WHERE created_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL;
  SELECT COUNT(DISTINCT company_id) INTO empresas_contato FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval;
  SELECT COUNT(*) INTO clientes_ativados FROM customers WHERE cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL;
  SELECT COUNT(*) INTO clientes_compraram FROM customers WHERE ja_comprou = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL;
  
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'funil', jsonb_build_array(
      jsonb_build_object('etapa', 'Empresas Cadastradas', 'quantidade', total_empresas, 'percentual', 100),
      jsonb_build_object('etapa', 'Com Contato', 'quantidade', empresas_contato, 'percentual', ROUND(empresas_contato::numeric / NULLIF(total_empresas, 0) * 100, 2)),
      jsonb_build_object('etapa', 'Clientes Ativados', 'quantidade', clientes_ativados, 'percentual', ROUND(clientes_ativados::numeric / NULLIF(total_empresas, 0) * 100, 2)),
      jsonb_build_object('etapa', 'Compraram', 'quantidade', clientes_compraram, 'percentual', ROUND(clientes_compraram::numeric / NULLIF(total_empresas, 0) * 100, 2))
    ),
    'taxas_conversao', jsonb_build_object(
      'contato_para_ativacao', ROUND(clientes_ativados::numeric / NULLIF(empresas_contato, 0) * 100, 2),
      'ativacao_para_compra', ROUND(clientes_compraram::numeric / NULLIF(clientes_ativados, 0) * 100, 2),
      'contato_para_compra', ROUND(clientes_compraram::numeric / NULLIF(empresas_contato, 0) * 100, 2)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
