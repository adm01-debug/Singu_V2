CREATE OR REPLACE FUNCTION public.identify_upsell_opportunities(p_limit integer DEFAULT 100)
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
  FOR v_company IN
    SELECT 
      c.id,
      c.nome_crm,
      c.user_id,
      (SELECT MAX(valor) FROM deals WHERE company_id = c.id AND status = 'ganho') as max_deal,
      (SELECT AVG(valor) FROM deals WHERE company_id = c.id AND status = 'ganho') as avg_deal
    FROM companies c
    WHERE c.is_customer = true
      AND c.status = 'ativo'
      AND c.deleted_at IS NULL
      AND (SELECT COUNT(*) FROM deals WHERE company_id = c.id AND status = 'ganho') >= 2
      AND NOT EXISTS (
        SELECT 1 FROM sales_opportunities so 
        WHERE so.company_id = c.id 
          AND so.opportunity_type = 'up_sell'
          AND so.status IN ('identified', 'qualified', 'pursuing')
      )
    LIMIT p_limit
  LOOP
    INSERT INTO sales_opportunities (
      company_id, opportunity_type, title, description,
      estimated_value, confidence_score, priority, assigned_to
    ) VALUES (
      v_company.id,
      'up_sell',
      'Oportunidade de Up-sell - ' || v_company.nome_crm,
      'Cliente recorrente com ticket médio de R$ ' || ROUND(v_company.avg_deal::numeric, 2) || '. Potencial para upgrade.',
      v_company.max_deal * 1.5,
      70,
      'medium',
      v_company.user_id
    );
    v_count := v_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'opportunities_created', v_count
  );
END;
$function$
