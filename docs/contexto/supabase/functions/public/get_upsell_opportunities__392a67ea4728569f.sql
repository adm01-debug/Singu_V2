CREATE OR REPLACE FUNCTION public.get_upsell_opportunities(p_limit integer DEFAULT 50)
 RETURNS TABLE(company_id uuid, nome_crm text, vendedor_nome text, valor_total_compras numeric, ticket_medio numeric, total_pedidos integer, dias_desde_ultima_compra integer, oportunidade_score integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.nome_crm,
    s.nome as vendedor_nome,
    cu.valor_total_compras,
    cu.ticket_medio,
    cu.total_pedidos,
    EXTRACT(DAY FROM now() - cu.updated_at)::int as dias_desde_ultima_compra,
    -- Score de oportunidade: baseado em histórico de compras e tempo
    (
      CASE WHEN cu.valor_total_compras > 10000 THEN 30 ELSE LEAST(cu.valor_total_compras::int / 500, 20) END +
      CASE WHEN cu.total_pedidos > 5 THEN 25 ELSE cu.total_pedidos * 5 END +
      CASE 
        WHEN EXTRACT(DAY FROM now() - cu.updated_at) BETWEEN 30 AND 90 THEN 30
        WHEN EXTRACT(DAY FROM now() - cu.updated_at) BETWEEN 91 AND 180 THEN 15
        ELSE 5
      END
    )::int as oportunidade_score
  FROM companies c
  JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  AND cu.ja_comprou = true
  AND cu.cliente_ativado = true
  ORDER BY oportunidade_score DESC
  LIMIT p_limit;
END;
$function$
