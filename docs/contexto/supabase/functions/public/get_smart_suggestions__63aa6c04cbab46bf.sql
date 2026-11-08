CREATE OR REPLACE FUNCTION public.get_smart_suggestions(p_vendedor_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 10)
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
    'sugestoes', jsonb_build_object(
      'clientes_vip_inativos', (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
          SELECT c.id, c.nome_crm, cu.valor_total_compras,
                 EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id))::int as dias_sem_contato
          FROM companies c
          JOIN customers cu ON cu.company_id = c.id
          WHERE cu.valor_total_compras >= 50000 AND cu.deleted_at IS NULL
          AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
          AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.created_at >= now() - interval '30 days')
          ORDER BY cu.valor_total_compras DESC
          LIMIT 5
        ) t
      ),
      'leads_quentes', (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
          SELECT c.id, c.nome_crm, COUNT(i.id) as interacoes_recentes
          FROM companies c
          JOIN interactions i ON i.company_id = c.id AND i.created_at >= now() - interval '7 days'
          LEFT JOIN customers cu ON cu.company_id = c.id
          WHERE c.deleted_at IS NULL
          AND (cu.ja_comprou IS NULL OR cu.ja_comprou = false)
          AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
          GROUP BY c.id, c.nome_crm
          HAVING COUNT(i.id) >= 3
          ORDER BY COUNT(i.id) DESC
          LIMIT 5
        ) t
      ),
      'followups_urgentes', (
        SELECT jsonb_agg(row_to_json(t))
        FROM (
          SELECT c.id as company_id, c.nome_crm, i.data_followup, i.resumo_interacao
          FROM interactions i
          JOIN companies c ON c.id = i.company_id
          WHERE i.followup_pendente = true
          AND i.data_followup < now()
          AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
          ORDER BY i.data_followup
          LIMIT 5
        ) t
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
