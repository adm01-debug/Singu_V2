CREATE OR REPLACE FUNCTION public.get_pipeline_analysis()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'etapas', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.ordem)
      FROM (
        SELECT 
          ps.id,
          ps.name as etapa,
          ps.order_position as ordem,
          (SELECT COUNT(*) FROM companies WHERE pipeline_stage_id = ps.id AND deleted_at IS NULL) as empresas,
          (SELECT COUNT(*) FROM companies WHERE pipeline_stage_id = ps.id AND status = 'ativo' AND deleted_at IS NULL) as empresas_ativas
        FROM pipeline_stages ps
        ORDER BY ps.order_position
      ) t
    ),
    'totais', jsonb_build_object(
      'empresas_no_pipeline', (SELECT COUNT(*) FROM companies WHERE pipeline_stage_id IS NOT NULL AND deleted_at IS NULL),
      'empresas_sem_etapa', (SELECT COUNT(*) FROM companies WHERE pipeline_stage_id IS NULL AND deleted_at IS NULL)
    ),
    'conversao_entre_etapas', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT 
          ps1.name as de,
          ps2.name as para,
          COUNT(*) as movimentacoes
        FROM companies c
        JOIN pipeline_stages ps1 ON ps1.id = c.pipeline_stage_id
        CROSS JOIN pipeline_stages ps2
        WHERE ps2.order_position = ps1.order_position + 1
        GROUP BY ps1.name, ps2.name, ps1.order_position
        ORDER BY ps1.order_position
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
