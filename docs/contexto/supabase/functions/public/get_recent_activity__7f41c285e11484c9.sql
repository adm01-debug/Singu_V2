CREATE OR REPLACE FUNCTION public.get_recent_activity(p_hours integer DEFAULT 24)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_horas', p_hours,
    'interacoes', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC)
      FROM (
        SELECT i.id, i.tipo_interacao, i.canal, c.nome_crm, s.nome as vendedor, i.created_at
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        LEFT JOIN salespeople s ON s.id = i.usuario_responsavel_id
        WHERE i.created_at >= now() - (p_hours || ' hours')::interval
        ORDER BY i.created_at DESC
        LIMIT 20
      ) t
    ),
    'empresas_novas', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.created_at DESC)
      FROM (
        SELECT id, nome_crm, cidade, uf, created_at
        FROM companies
        WHERE created_at >= now() - (p_hours || ' hours')::interval AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 10
      ) t
    ),
    'alertas_resolvidos', (SELECT COUNT(*) FROM alerts WHERE resolved_at >= now() - (p_hours || ' hours')::interval)
  ) INTO result;
  
  RETURN result;
END;
$function$
