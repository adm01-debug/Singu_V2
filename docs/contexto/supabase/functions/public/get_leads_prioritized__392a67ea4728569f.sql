CREATE OR REPLACE FUNCTION public.get_leads_prioritized(p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, engagement_score integer, priority_level text, last_interaction timestamp with time zone, days_since_interaction integer, contact_count bigint)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  WITH scored_leads AS (
    SELECT 
      c.id as company_id,
      c.nome_crm,
      COALESCE(
        -- Score baseado em interações recentes
        CASE 
          WHEN MAX(i.created_at) >= now() - interval '7 days' THEN 40
          WHEN MAX(i.created_at) >= now() - interval '30 days' THEN 25
          WHEN MAX(i.created_at) >= now() - interval '90 days' THEN 10
          ELSE 0
        END +
        -- Score baseado em quantidade de contatos
        LEAST(COUNT(DISTINCT ct.id) * 5, 20) +
        -- Score baseado em quantidade de interações
        LEAST(COUNT(i.id) * 2, 20) +
        -- Bonus se cliente ativado
        CASE WHEN cu.cliente_ativado = true THEN 20 ELSE 0 END
      , 0)::int as engagement_score,
      MAX(i.created_at) as last_interaction,
      EXTRACT(DAY FROM now() - MAX(i.created_at))::int as days_since,
      COUNT(DISTINCT ct.id) as contact_cnt
    FROM companies c
    LEFT JOIN interactions i ON i.company_id = c.id
    LEFT JOIN contacts ct ON ct.company_id = c.id AND ct.deleted_at IS NULL
    LEFT JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
    WHERE c.deleted_at IS NULL
    AND c.status = 'ativo'
    GROUP BY c.id, c.nome_crm, cu.cliente_ativado
  )
  SELECT 
    sl.company_id,
    sl.nome_crm,
    sl.engagement_score,
    CASE 
      WHEN sl.engagement_score >= 60 THEN 'hot'
      WHEN sl.engagement_score >= 30 THEN 'warm'
      ELSE 'cold'
    END as priority_level,
    sl.last_interaction,
    sl.days_since as days_since_interaction,
    sl.contact_cnt as contact_count
  FROM scored_leads sl
  ORDER BY sl.engagement_score DESC
  LIMIT p_limit;
END;
$function$
