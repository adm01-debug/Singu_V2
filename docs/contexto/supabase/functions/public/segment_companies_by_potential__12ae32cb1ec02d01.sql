CREATE OR REPLACE FUNCTION public.segment_companies_by_potential()
 RETURNS TABLE(segment text, description text, company_count bigint, total_potential numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH scored AS (
    SELECT c.id,
      CASE 
        WHEN c.is_customer = true AND EXISTS (SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho' AND d.valor > 10000) THEN 'VIP'
        WHEN c.is_customer = true THEN 'Cliente Ativo'
        WHEN EXISTS (SELECT 1 FROM deals d WHERE d.company_id = c.id AND d.status NOT IN ('ganho', 'perdido')) THEN 'Em Negociação'
        WHEN EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days') THEN 'Prospectado Recente'
        WHEN EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id) THEN 'Prospectado Antigo'
        ELSE 'Novo Lead'
      END as segment,
      COALESCE((SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho'), 0) as potential
    FROM companies c WHERE c.deleted_at IS NULL
  )
  SELECT segment,
    CASE segment
      WHEN 'VIP' THEN 'Clientes de alto valor, prioridade máxima'
      WHEN 'Cliente Ativo' THEN 'Clientes com compras, manter relacionamento'
      WHEN 'Em Negociação' THEN 'Deals em andamento, foco em fechamento'
      WHEN 'Prospectado Recente' THEN 'Contato recente, nutrir relacionamento'
      WHEN 'Prospectado Antigo' THEN 'Sem contato recente, reativar'
      ELSE 'Sem interação, iniciar prospecção'
    END,
    COUNT(*), SUM(potential)
  FROM scored GROUP BY segment ORDER BY SUM(potential) DESC;
$function$
