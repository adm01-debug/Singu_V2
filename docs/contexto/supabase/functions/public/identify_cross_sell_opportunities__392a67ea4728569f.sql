CREATE OR REPLACE FUNCTION public.identify_cross_sell_opportunities(p_limit integer DEFAULT 100)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
  v_company RECORD;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Identificar clientes ativos com potencial de cross-sell
  FOR v_company IN
    SELECT 
      c.id,
      c.nome_crm,
      c.user_id,
      (SELECT COUNT(*) FROM deals WHERE company_id = c.id AND status = 'ganho') as deals_count,
      (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE company_id = c.id AND status = 'ganho') as total_value
    FROM companies c
    WHERE c.is_customer = true
      AND c.status = 'ativo'
      AND c.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM sales_opportunities so 
        WHERE so.company_id = c.id 
          AND so.opportunity_type = 'cross_sell'
          AND so.status IN ('identified', 'qualified', 'pursuing')
      )
    ORDER BY (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE company_id = c.id AND status = 'ganho') DESC
    LIMIT p_limit
  LOOP
    IF v_company.total_value > 10000 THEN
      INSERT INTO sales_opportunities (
        company_id, opportunity_type, title, description, 
        estimated_value, confidence_score, priority, assigned_to
      ) VALUES (
        v_company.id,
        'cross_sell',
        'Oportunidade de Cross-sell - ' || v_company.nome_crm,
        'Cliente com histórico de compras. Potencial para novos produtos.',
        v_company.total_value * 0.3, -- 30% do valor histórico
        CASE 
          WHEN v_company.total_value > 100000 THEN 80
          WHEN v_company.total_value > 50000 THEN 70
          ELSE 60
        END,
        CASE 
          WHEN v_company.total_value > 100000 THEN 'high'
          WHEN v_company.total_value > 50000 THEN 'medium'
          ELSE 'low'
        END,
        v_company.user_id
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'opportunities_created', v_count
  );
END;
$function$
