CREATE OR REPLACE FUNCTION public.get_lost_opportunities_analysis(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'total_leads_abandonados', (
      SELECT COUNT(*) FROM companies c
      LEFT JOIN customers cu ON cu.company_id = c.id
      WHERE c.deleted_at IS NULL 
      AND (cu.ja_comprou IS NULL OR cu.ja_comprou = false)
      AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval)
    ),
    'por_motivo_estimado', jsonb_build_object(
      'sem_followup', (
        SELECT COUNT(*) FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id
        WHERE c.deleted_at IS NULL 
        AND (cu.ja_comprou IS NULL OR cu.ja_comprou = false)
        AND EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.followup_pendente = true)
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval)
      ),
      'pouca_interacao', (
        SELECT COUNT(*) FROM companies c
        LEFT JOIN customers cu ON cu.company_id = c.id
        WHERE c.deleted_at IS NULL 
        AND (cu.ja_comprou IS NULL OR cu.ja_comprou = false)
        AND (SELECT COUNT(*) FROM interactions i WHERE i.company_id = c.id) < 3
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - (p_days || ' days')::interval)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
