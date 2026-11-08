CREATE OR REPLACE FUNCTION public.get_detailed_funnel(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_empresas bigint;
  com_contato bigint;
  com_interacao bigint;
  ativados bigint;
  compradores bigint;
BEGIN
  -- Calcular métricas
  SELECT COUNT(*) INTO total_empresas FROM companies WHERE created_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL;
  SELECT COUNT(DISTINCT company_id) INTO com_contato FROM contacts WHERE created_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL;
  SELECT COUNT(DISTINCT company_id) INTO com_interacao FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval;
  SELECT COUNT(*) INTO ativados FROM customers WHERE cliente_ativado = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL;
  SELECT COUNT(*) INTO compradores FROM customers WHERE ja_comprou = true AND updated_at >= now() - (p_days || ' days')::interval AND deleted_at IS NULL;
  
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'funil', jsonb_build_array(
      jsonb_build_object('etapa', 'Empresas Cadastradas', 'total', total_empresas, 'percentual', 100),
      jsonb_build_object('etapa', 'Com Contato', 'total', com_contato, 'percentual', ROUND(com_contato::numeric / NULLIF(total_empresas, 0) * 100, 2)),
      jsonb_build_object('etapa', 'Com Interação', 'total', com_interacao, 'percentual', ROUND(com_interacao::numeric / NULLIF(total_empresas, 0) * 100, 2)),
      jsonb_build_object('etapa', 'Cliente Ativado', 'total', ativados, 'percentual', ROUND(ativados::numeric / NULLIF(total_empresas, 0) * 100, 2)),
      jsonb_build_object('etapa', 'Comprou', 'total', compradores, 'percentual', ROUND(compradores::numeric / NULLIF(total_empresas, 0) * 100, 2))
    ),
    'taxa_conversao_global', ROUND(compradores::numeric / NULLIF(total_empresas, 0) * 100, 2)
  ) INTO result;
  
  RETURN result;
END;
$function$
