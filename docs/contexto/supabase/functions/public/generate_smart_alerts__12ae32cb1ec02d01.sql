CREATE OR REPLACE FUNCTION public.generate_smart_alerts()
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
  -- Alerta: Clientes VIP inativos (60+ dias)
  INSERT INTO alerts (company_id, tipo_alerta, titulo, descricao, prioridade)
  SELECT 
    cu.company_id,
    'inatividade_vip',
    'Cliente VIP inativo há mais de 60 dias',
    'Cliente com valor > R$10.000 sem interação recente',
    'high'
  FROM customers cu
  WHERE cu.valor_total_compras >= 10000
  AND cu.cliente_ativado = true
  AND cu.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = cu.company_id AND i.created_at >= now() - interval '60 days')
  AND NOT EXISTS (SELECT 1 FROM alerts a WHERE a.company_id = cu.company_id AND a.tipo_alerta = 'inatividade_vip' AND a.resolved_at IS NULL);
  
  GET DIAGNOSTICS alerts_created = ROW_COUNT;
  
  -- Alerta: Followups atrasados
  INSERT INTO alerts (company_id, tipo_alerta, titulo, descricao, prioridade)
  SELECT 
    i.company_id,
    'followup_atrasado',
    'Followup atrasado há mais de 7 dias',
    'Interação com followup pendente atrasado',
    'medium'
  FROM interactions i
  WHERE i.followup_pendente = true
  AND i.data_followup < now() - interval '7 days'
  AND NOT EXISTS (SELECT 1 FROM alerts a WHERE a.company_id = i.company_id AND a.tipo_alerta = 'followup_atrasado' AND a.resolved_at IS NULL);
  
  alerts_created := alerts_created + ROW_COUNT;
  
  -- Alerta: Clientes sem contato cadastrado
  INSERT INTO alerts (company_id, tipo_alerta, titulo, descricao, prioridade)
  SELECT 
    c.id,
    'sem_contato',
    'Empresa sem contato cadastrado',
    'Cadastrar pelo menos um contato para esta empresa',
    'low'
  FROM companies c
  WHERE c.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM contacts ct WHERE ct.company_id = c.id AND ct.deleted_at IS NULL)
  AND NOT EXISTS (SELECT 1 FROM alerts a WHERE a.company_id = c.id AND a.tipo_alerta = 'sem_contato' AND a.resolved_at IS NULL)
  LIMIT 50; -- Limita para não criar muitos de uma vez
  
  alerts_created := alerts_created + ROW_COUNT;
  
  SELECT jsonb_build_object(
    'success', true,
    'alertas_criados', alerts_created,
    'timestamp', now()
  ) INTO result;
  
  RETURN result;
END;
$function$
