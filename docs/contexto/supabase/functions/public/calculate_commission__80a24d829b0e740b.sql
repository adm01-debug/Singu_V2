CREATE OR REPLACE FUNCTION public.calculate_commission(p_deal_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deal RECORD;
  v_rule RECORD;
  v_commission numeric;
  v_commission_id uuid;
BEGIN
  PERFORM public.assert_deal_access(p_deal_id);
  SELECT * INTO v_deal FROM deals WHERE id = p_deal_id;
  SELECT * INTO v_rule FROM commission_rules WHERE is_active = true AND v_deal.valor >= min_deal_value ORDER BY base_percentage DESC LIMIT 1;
  
  IF v_rule IS NULL THEN
    RETURN jsonb_build_object('error', 'Nenhuma regra de comissão aplicável');
  END IF;
  
  v_commission := v_deal.valor * (v_rule.base_percentage / 100);
  
  INSERT INTO commissions (user_id, deal_id, rule_id, deal_value, commission_pct, commission_value)
  VALUES (v_deal.user_id, p_deal_id, v_rule.id, v_deal.valor, v_rule.base_percentage, v_commission)
  RETURNING id INTO v_commission_id;
  
  RETURN jsonb_build_object(
    'commission_id', v_commission_id,
    'deal_value', v_deal.valor,
    'commission_pct', v_rule.base_percentage,
    'commission_value', v_commission
  );
END;
$function$
