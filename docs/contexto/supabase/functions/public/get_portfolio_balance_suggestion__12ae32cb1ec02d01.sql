CREATE OR REPLACE FUNCTION public.get_portfolio_balance_suggestion()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  avg_per_seller numeric;
BEGIN
  SELECT ROUND(AVG(cnt), 0) INTO avg_per_seller
  FROM (SELECT COUNT(*) as cnt FROM customers WHERE vendedor_id IS NOT NULL AND deleted_at IS NULL GROUP BY vendedor_id) t;
  
  SELECT jsonb_build_object(
    'media_ideal', avg_per_seller,
    'vendedores_sobrecarregados', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT s.id, s.nome, COUNT(cu.id) as total, COUNT(cu.id) - avg_per_seller as excesso
        FROM salespeople s
        JOIN customers cu ON cu.vendedor_id = s.id AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
        HAVING COUNT(cu.id) > avg_per_seller * 1.5
      ) t
    ),
    'vendedores_subutilizados', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT s.id, s.nome, COUNT(cu.id) as total, avg_per_seller - COUNT(cu.id) as capacidade
        FROM salespeople s
        LEFT JOIN customers cu ON cu.vendedor_id = s.id AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
        HAVING COUNT(cu.id) < avg_per_seller * 0.5
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
