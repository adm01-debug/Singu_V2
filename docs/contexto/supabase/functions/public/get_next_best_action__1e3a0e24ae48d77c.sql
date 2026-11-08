CREATE OR REPLACE FUNCTION public.get_next_best_action(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_last_int timestamptz; v_last_type text; v_has_deal boolean; v_is_customer boolean; v_action jsonb;
BEGIN
  SELECT MAX(data_interacao), (SELECT type FROM interactions WHERE company_id = p_company_id ORDER BY data_interacao DESC LIMIT 1) INTO v_last_int, v_last_type FROM interactions WHERE company_id = p_company_id;
  SELECT EXISTS(SELECT 1 FROM deals WHERE company_id = p_company_id AND status NOT IN ('ganho', 'perdido')) INTO v_has_deal;
  SELECT is_customer INTO v_is_customer FROM companies WHERE id = p_company_id;
  
  -- Sem interação há muito tempo
  IF v_last_int IS NULL OR v_last_int < NOW() - interval '30 days' THEN
    RETURN jsonb_build_object('action', 'Reativar contato', 'priority', 'ALTA', 'channel', 'call', 'reason', 'Sem interação há mais de 30 dias');
  END IF;
  
  -- Cliente sem compra recente
  IF v_is_customer AND NOT EXISTS (SELECT 1 FROM deals WHERE company_id = p_company_id AND status = 'ganho' AND closed_at >= NOW() - interval '90 days') THEN
    RETURN jsonb_build_object('action', 'Oferecer novos produtos', 'priority', 'MÉDIA', 'channel', 'email', 'reason', 'Cliente sem compra há 90 dias');
  END IF;
  
  -- Deal aberto sem movimentação
  IF v_has_deal AND (SELECT updated_at FROM deals WHERE company_id = p_company_id AND status NOT IN ('ganho', 'perdido') ORDER BY updated_at DESC LIMIT 1) < NOW() - interval '7 days' THEN
    RETURN jsonb_build_object('action', 'Follow-up no deal', 'priority', 'ALTA', 'channel', 'whatsapp', 'reason', 'Deal parado há 7+ dias');
  END IF;
  
  -- Última interação foi email, sugerir ligação
  IF v_last_type = 'email' THEN
    RETURN jsonb_build_object('action', 'Ligar para confirmar recebimento', 'priority', 'MÉDIA', 'channel', 'call', 'reason', 'Último contato foi email');
  END IF;
  
  -- Default
  RETURN jsonb_build_object('action', 'Manter relacionamento', 'priority', 'BAIXA', 'channel', 'email', 'reason', 'Relacionamento ativo');
END;
$function$
