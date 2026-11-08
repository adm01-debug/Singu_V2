CREATE OR REPLACE FUNCTION public.create_proposal(p_company_id uuid, p_titulo text, p_valor_total numeric DEFAULT 0, p_desconto_percentual numeric DEFAULT 0, p_validade_dias integer DEFAULT 30, p_itens jsonb DEFAULT '[]'::jsonb, p_deal_id uuid DEFAULT NULL::uuid, p_contact_id uuid DEFAULT NULL::uuid, p_user_id uuid DEFAULT auth.uid())
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_proposal_id uuid;
  v_valor_final numeric;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  v_valor_final := p_valor_total * (1 - p_desconto_percentual / 100);
  
  INSERT INTO proposals (
    company_id, contact_id, deal_id, user_id, numero, titulo, 
    valor_total, desconto_percentual, valor_final, validade_dias, itens
  )
  VALUES (
    p_company_id, p_contact_id, p_deal_id, p_user_id, generate_proposal_number(), p_titulo,
    p_valor_total, p_desconto_percentual, v_valor_final, p_validade_dias, p_itens
  )
  RETURNING id INTO v_proposal_id;
  
  RETURN v_proposal_id;
END;
$function$
