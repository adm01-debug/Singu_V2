CREATE OR REPLACE FUNCTION public.get_pending_tasks(p_vendedor_id integer DEFAULT NULL::integer)
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
    'vendedor_id', p_vendedor_id,
    'followups_pendentes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          i.id as interaction_id,
          i.company_id,
          c.nome_crm,
          COALESCE(i.data_followup, i.follow_up_date::timestamptz) as data_followup,
          i.type AS tipo_interacao,
          EXTRACT(DAY FROM COALESCE(i.data_followup, i.follow_up_date::timestamptz) - now())::int as dias_restantes
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE (COALESCE(i.requer_followup, false) AND NOT COALESCE(i.followup_concluido, false)
               OR COALESCE(i.follow_up_required, false))
        AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
        AND COALESCE(i.data_followup, i.follow_up_date::timestamptz) IS NOT NULL
        ORDER BY data_followup ASC
        LIMIT 20
      ) t
    ),
    'alertas_nao_resolvidos', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT
          a.id as alert_id,
          a.company_id,
          c.nome_crm,
          a.type AS tipo_alerta,
          a.title AS titulo,
          a.priority AS prioridade,
          a.created_at
        FROM alerts a
        JOIN companies c ON c.id = a.company_id
        LEFT JOIN customers cu ON cu.company_id = a.company_id
        WHERE a.status = 'pending'
        AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
        ORDER BY
          CASE a.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
          a.created_at DESC
        LIMIT 20
      ) t
    ),
    'clientes_sem_interacao_30d', (
      SELECT COUNT(*)
      FROM customers cu
      WHERE cu.cliente_ativado = true
      AND cu.deleted_at IS NULL
      AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
      AND NOT EXISTS (
        SELECT 1 FROM interactions i
        WHERE i.company_id = cu.company_id
        AND i.created_at >= now() - interval '30 days'
      )
    )
  ) INTO result;

  RETURN result;
END;
$function$
