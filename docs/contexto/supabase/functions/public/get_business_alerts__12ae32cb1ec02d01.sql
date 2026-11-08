CREATE OR REPLACE FUNCTION public.get_business_alerts()
 RETURNS TABLE(alert_type text, severity text, message text, affected_count integer, action_required text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Pipeline baixo
  IF (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido')) < 10 THEN
    RETURN QUERY SELECT 'pipeline_low'::text, 'CRÍTICO'::text, 'Pipeline muito baixo'::text, (SELECT COUNT(*)::int FROM deals WHERE status NOT IN ('ganho', 'perdido')), 'Prospectar novos leads urgentemente'::text;
  END IF;
  
  -- Deals de alto valor parados
  IF EXISTS (SELECT 1 FROM deals WHERE status NOT IN ('ganho', 'perdido') AND valor >= 20000 AND updated_at < NOW() - interval '7 days') THEN
    RETURN QUERY SELECT 'high_value_stalled', 'ALTO', 'Deals de alto valor parados', (SELECT COUNT(*)::int FROM deals WHERE status NOT IN ('ganho', 'perdido') AND valor >= 20000 AND updated_at < NOW() - interval '7 days'), 'Revisar e movimentar deals';
  END IF;
  
  -- Taxa de conversão caindo
  IF (SELECT COUNT(*) FILTER (WHERE status = 'perdido')::numeric / NULLIF(COUNT(*) FILTER (WHERE status IN ('ganho', 'perdido')), 0) FROM deals WHERE closed_at >= NOW() - interval '30 days') > 0.7 THEN
    RETURN QUERY SELECT 'conversion_drop', 'ALTO', 'Taxa de perda acima de 70%', (SELECT COUNT(*)::int FROM deals WHERE status = 'perdido' AND closed_at >= NOW() - interval '30 days'), 'Analisar motivos de perda';
  END IF;
  
  -- Clientes VIP sem contato
  IF (SELECT COUNT(*) FROM companies c WHERE c.is_customer = true AND (SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho') > 50000 
    AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days')) > 0 THEN
    RETURN QUERY SELECT 'vip_inactive', 'MÉDIO', 'Clientes VIP sem contato recente', 
      (SELECT COUNT(*)::int FROM companies c WHERE c.is_customer = true AND (SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho') > 50000 
        AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days')),
      'Agendar contato com clientes VIP';
  END IF;
  
  -- Se não houver alertas
  IF NOT FOUND THEN
    RETURN QUERY SELECT 'all_clear'::text, 'INFO'::text, 'Nenhum alerta crítico no momento'::text, 0, 'Manter operação normal'::text;
  END IF;
END;
$function$
