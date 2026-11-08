CREATE OR REPLACE FUNCTION public.get_urgent_next_actions(p_vendedor_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 10)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'followups_atrasados', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT i.id, c.nome_crm, i.data_followup, i.resumo_interacao,
               EXTRACT(DAY FROM now() - i.data_followup)::int as dias_atraso
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE i.followup_pendente = true AND i.data_followup < now()
        AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
        ORDER BY i.data_followup
        LIMIT p_limit
      ) t
    ),
    'alertas_urgentes', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT a.id, a.tipo, a.mensagem, c.nome_crm
        FROM alerts a
        JOIN companies c ON c.id = a.company_id
        LEFT JOIN customers cu ON cu.company_id = a.company_id
        WHERE a.resolved_at IS NULL AND a.prioridade = 'high'
        AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
        LIMIT p_limit
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
