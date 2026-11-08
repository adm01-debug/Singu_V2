CREATE OR REPLACE FUNCTION public.generate_auto_alerts()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  alerts_created int := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Alerta: Clientes VIP sem interação há 60+ dias
  INSERT INTO alerts (company_id, contact_id, tipo_alerta, titulo, descricao, prioridade)
  SELECT DISTINCT cu.company_id, NULL, 'churn_risk', 
    'Cliente VIP sem interação',
    'Cliente VIP sem interação há mais de 60 dias. Valor total: R$ ' || COALESCE(cu.valor_total_compras, 0)::text,
    'high'
  FROM customers cu
  WHERE cu.ja_comprou = true 
  AND cu.cliente_ativado = true
  AND cu.valor_total_compras > 5000
  AND cu.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '60 days'
  )
  AND NOT EXISTS (
    SELECT 1 FROM alerts a WHERE a.company_id = cu.company_id AND a.tipo_alerta = 'churn_risk' AND a.created_at >= now() - interval '7 days'
  );
  
  GET DIAGNOSTICS alerts_created = ROW_COUNT;
  
  SELECT jsonb_build_object(
    'timestamp', now(),
    'alerts_created', alerts_created,
    'message', 'Alertas automáticos gerados com sucesso'
  ) INTO result;
  
  RETURN result;
END;
$function$
