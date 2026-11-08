CREATE OR REPLACE FUNCTION public.get_weekly_plan(p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'semana', date_trunc('week', now()),
    'vendedor_id', p_vendedor_id,
    'resumo', jsonb_build_object(
      'followups_semana', (
        SELECT COUNT(*) FROM interactions i
        WHERE i.followup_pendente = true
        AND i.data_followup >= date_trunc('week', now())
        AND i.data_followup < date_trunc('week', now()) + interval '7 days'
        AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
      ),
      'alertas_pendentes', (
        SELECT COUNT(*) FROM alerts a
        LEFT JOIN customers cu ON cu.company_id = a.company_id
        WHERE a.resolved_at IS NULL
        AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
      ),
      'clientes_sem_contato_30d', (
        SELECT COUNT(*) FROM customers cu
        WHERE (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
        AND cu.deleted_at IS NULL
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '30 days')
      )
    ),
    'por_dia', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia)
      FROM (
        SELECT 
          i.data_followup::date as dia,
          to_char(i.data_followup, 'Day') as dia_nome,
          COUNT(*) as followups
        FROM interactions i
        WHERE i.followup_pendente = true
        AND i.data_followup >= date_trunc('week', now())
        AND i.data_followup < date_trunc('week', now()) + interval '7 days'
        AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
        GROUP BY i.data_followup::date, to_char(i.data_followup, 'Day')
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
