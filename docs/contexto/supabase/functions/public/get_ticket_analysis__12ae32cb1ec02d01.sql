CREATE OR REPLACE FUNCTION public.get_ticket_analysis()
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
    'ticket_medio_global', (SELECT ROUND(AVG(ticket_medio), 2) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL),
    'ticket_mediano', (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ticket_medio) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL),
    'distribuicao', jsonb_build_object(
      'ate_1000', (SELECT COUNT(*) FROM customers WHERE ticket_medio <= 1000 AND ticket_medio > 0 AND deleted_at IS NULL),
      'entre_1000_5000', (SELECT COUNT(*) FROM customers WHERE ticket_medio > 1000 AND ticket_medio <= 5000 AND deleted_at IS NULL),
      'entre_5000_10000', (SELECT COUNT(*) FROM customers WHERE ticket_medio > 5000 AND ticket_medio <= 10000 AND deleted_at IS NULL),
      'acima_10000', (SELECT COUNT(*) FROM customers WHERE ticket_medio > 10000 AND deleted_at IS NULL)
    ),
    'por_vendedor', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.ticket_medio DESC NULLS LAST)
      FROM (
        SELECT s.nome, ROUND(AVG(cu.ticket_medio), 2) as ticket_medio, COUNT(cu.id) as clientes
        FROM salespeople s
        JOIN customers cu ON cu.vendedor_id = s.id AND cu.ticket_medio > 0 AND cu.deleted_at IS NULL
        GROUP BY s.id, s.nome
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
