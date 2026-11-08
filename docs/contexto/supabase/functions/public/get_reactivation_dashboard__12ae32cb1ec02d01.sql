CREATE OR REPLACE FUNCTION public.get_reactivation_dashboard()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'inactive_30d', (SELECT COUNT(*) FROM companies c WHERE c.deleted_at IS NULL AND c.status = 'ativo' AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao > NOW() - INTERVAL '30 days')),
    'inactive_60d', (SELECT COUNT(*) FROM companies c WHERE c.deleted_at IS NULL AND c.status = 'ativo' AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao > NOW() - INTERVAL '60 days')),
    'critical_customers', (SELECT COUNT(*) FROM companies c WHERE c.deleted_at IS NULL AND c.status = 'ativo' AND c.is_customer = true AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao > NOW() - INTERVAL '30 days')),
    'revenue_at_risk', (SELECT COALESCE(SUM(d.valor), 0) FROM deals d JOIN companies c ON c.id = d.company_id WHERE c.is_customer = true AND d.status = 'ganho' AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao > NOW() - INTERVAL '30 days'))
  );
END;
$function$
