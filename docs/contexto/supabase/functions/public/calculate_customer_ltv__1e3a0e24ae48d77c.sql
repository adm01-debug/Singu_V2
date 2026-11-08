CREATE OR REPLACE FUNCTION public.calculate_customer_ltv(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  customer_record record;
  months_as_customer numeric;
  monthly_value numeric;
  projected_ltv numeric;
BEGIN
  SELECT * INTO customer_record
  FROM customers WHERE company_id = p_company_id AND deleted_at IS NULL LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Cliente não encontrado');
  END IF;
  
  -- Calcular meses como cliente
  months_as_customer := GREATEST(EXTRACT(EPOCH FROM now() - customer_record.created_at) / (30 * 24 * 60 * 60), 1);
  
  -- Valor mensal médio
  monthly_value := COALESCE(customer_record.valor_total_compras, 0) / months_as_customer;
  
  -- LTV projetado (assumindo 24 meses de relacionamento médio)
  projected_ltv := monthly_value * 24;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'metricas_atuais', jsonb_build_object(
      'valor_total_compras', customer_record.valor_total_compras,
      'total_pedidos', customer_record.total_pedidos,
      'ticket_medio', customer_record.ticket_medio,
      'meses_como_cliente', ROUND(months_as_customer, 1)
    ),
    'ltv', jsonb_build_object(
      'valor_mensal_medio', ROUND(monthly_value, 2),
      'ltv_atual', customer_record.valor_total_compras,
      'ltv_projetado_24m', ROUND(projected_ltv, 2),
      'categoria', CASE 
        WHEN projected_ltv >= 50000 THEN 'platinum'
        WHEN projected_ltv >= 20000 THEN 'gold'
        WHEN projected_ltv >= 5000 THEN 'silver'
        ELSE 'bronze'
      END
    ),
    'recomendacao', CASE
      WHEN monthly_value = 0 THEN 'Cliente inativo - iniciar campanha de reativação'
      WHEN months_as_customer < 3 THEN 'Cliente novo - focar em onboarding'
      WHEN customer_record.total_pedidos = 1 THEN 'Apenas 1 pedido - incentivar recompra'
      ELSE 'Cliente recorrente - manter relacionamento'
    END
  ) INTO result;
  
  RETURN result;
END;
$function$
