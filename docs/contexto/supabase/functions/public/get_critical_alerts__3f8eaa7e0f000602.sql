CREATE OR REPLACE FUNCTION public.get_critical_alerts(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN jsonb_build_object(
    'inactive_customers_30d', (SELECT COUNT(*) FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao > NOW() - INTERVAL '30 days')),
    'deals_stalled_7d', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - INTERVAL '7 days'),
    'tasks_overdue', (SELECT COUNT(*) FROM tasks WHERE status != 'done' AND due_date < CURRENT_DATE),
    'high_value_deals_at_risk', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND valor >= 10000 AND updated_at < NOW() - INTERVAL '14 days'),
    'companies_no_contact', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND status = 'ativo' AND NOT EXISTS (SELECT 1 FROM interactions WHERE company_id = companies.id))
  );
END;
$function$
