CREATE OR REPLACE FUNCTION public.consolidate_daily_metrics(p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'date', p_date,
    'companies', jsonb_build_object(
      'created', (SELECT COUNT(*) FROM companies WHERE date_trunc('day', created_at) = p_date AND deleted_at IS NULL),
      'updated', (SELECT COUNT(*) FROM companies WHERE date_trunc('day', updated_at) = p_date AND deleted_at IS NULL)
    ),
    'contacts', jsonb_build_object(
      'created', (SELECT COUNT(*) FROM contacts WHERE date_trunc('day', created_at) = p_date AND deleted_at IS NULL),
      'updated', (SELECT COUNT(*) FROM contacts WHERE date_trunc('day', updated_at) = p_date AND deleted_at IS NULL)
    ),
    'interactions', jsonb_build_object(
      'created', (SELECT COUNT(*) FROM interactions WHERE date_trunc('day', created_at) = p_date),
      'by_type', (
        SELECT jsonb_object_agg(COALESCE(tipo_interacao, 'outros'), cnt)
        FROM (
          SELECT tipo_interacao, COUNT(*) as cnt 
          FROM interactions 
          WHERE date_trunc('day', created_at) = p_date
          GROUP BY tipo_interacao
        ) t
      )
    ),
    'customers', jsonb_build_object(
      'activated', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND date_trunc('day', updated_at) = p_date AND deleted_at IS NULL),
      'new_purchases', (SELECT COUNT(*) FROM customers WHERE ja_comprou = true AND date_trunc('day', updated_at) = p_date AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
