CREATE OR REPLACE FUNCTION public.widget_sales_value()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'valor_total', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE deleted_at IS NULL),
    'valor_mes', (SELECT COALESCE(SUM(valor_total_compras), 0) FROM customers WHERE ja_comprou = true AND updated_at >= date_trunc('month', now()) AND deleted_at IS NULL),
    'ticket_medio', (SELECT ROUND(AVG(ticket_medio), 2) FROM customers WHERE ticket_medio > 0 AND deleted_at IS NULL),
    'clientes_compradores', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND deleted_at IS NULL)
  );
END;
$function$
