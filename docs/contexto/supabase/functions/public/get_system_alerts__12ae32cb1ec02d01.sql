CREATE OR REPLACE FUNCTION public.get_system_alerts()
 RETURNS TABLE(alert_type text, message text, severity text, count bigint)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT 'deals_parados', 'Deals sem atualização há mais de 7 dias', 'warning', 
    (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido') AND updated_at < NOW() - interval '7 days')
  UNION ALL
  SELECT 'empresas_inativas', 'Empresas sem interação há 30+ dias', 'info',
    (SELECT COUNT(*) FROM companies c WHERE c.deleted_at IS NULL AND NOT EXISTS (
      SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days'
    ))
  UNION ALL
  SELECT 'metas_atrasadas', 'Metas com menos de 50% do progresso', 'warning',
    (SELECT COUNT(*) FROM user_goals WHERE period_end >= CURRENT_DATE AND current_value < target_value * 0.5)
  UNION ALL
  SELECT 'estoque_baixo', 'Produtos com estoque abaixo do mínimo', 'danger',
    (SELECT COUNT(*) FROM products WHERE is_active = true AND stock_qty < min_stock);
$function$
