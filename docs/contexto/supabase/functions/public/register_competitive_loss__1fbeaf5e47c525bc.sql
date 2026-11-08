CREATE OR REPLACE FUNCTION public.register_competitive_loss(p_deal_id uuid, p_competitor_id uuid DEFAULT NULL::uuid, p_competitor_name text DEFAULT NULL::text, p_loss_reason text DEFAULT NULL::text, p_price_difference numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_loss_id uuid;
  v_deal deals%ROWTYPE;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT * INTO v_deal FROM deals WHERE id = p_deal_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Deal não encontrado');
  END IF;
  
  INSERT INTO competitive_losses (
    deal_id, company_id, competitor_id, competitor_name,
    loss_reason, price_difference, notes, reported_by
  ) VALUES (
    p_deal_id, v_deal.company_id, p_competitor_id, p_competitor_name,
    p_loss_reason, p_price_difference, p_notes, p_user_id
  )
  RETURNING id INTO v_loss_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'loss_id', v_loss_id
  );
END;
$function$
