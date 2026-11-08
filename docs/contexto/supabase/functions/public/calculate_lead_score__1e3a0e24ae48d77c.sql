CREATE OR REPLACE FUNCTION public.calculate_lead_score(p_company_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_score integer := 0;
  v_company companies%ROWTYPE;
  v_interaction_count integer;
  v_last_interaction_days integer;
  v_has_deal boolean;
  v_has_proposal boolean;
  v_has_contact boolean;
  v_rfm_score numeric;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  -- Buscar empresa
  SELECT * INTO v_company FROM companies WHERE id = p_company_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  -- 1. Score por dados completos (máx 20 pontos)
  IF v_company.cnpj IS NOT NULL THEN v_score := v_score + 5; END IF;
  IF v_company.ramo_atividade IS NOT NULL THEN v_score := v_score + 5; END IF;
  IF EXISTS (SELECT 1 FROM company_emails WHERE company_id = p_company_id) THEN v_score := v_score + 5; END IF;
  IF EXISTS (SELECT 1 FROM company_phones WHERE company_id = p_company_id) THEN v_score := v_score + 5; END IF;
  
  -- 2. Score por interações (máx 30 pontos)
  SELECT COUNT(*) INTO v_interaction_count FROM interactions WHERE company_id = p_company_id;
  v_score := v_score + LEAST(v_interaction_count * 2, 20);
  
  -- Recência de interação (máx 10 pontos)
  SELECT EXTRACT(DAY FROM NOW() - MAX(data_interacao))::integer INTO v_last_interaction_days
  FROM interactions WHERE company_id = p_company_id;
  
  IF v_last_interaction_days IS NOT NULL THEN
    IF v_last_interaction_days <= 7 THEN v_score := v_score + 10;
    ELSIF v_last_interaction_days <= 30 THEN v_score := v_score + 7;
    ELSIF v_last_interaction_days <= 90 THEN v_score := v_score + 3;
    END IF;
  END IF;
  
  -- 3. Score por pipeline (máx 30 pontos)
  SELECT EXISTS (SELECT 1 FROM deals WHERE company_id = p_company_id AND status NOT IN ('perdido', 'arquivado')) INTO v_has_deal;
  IF v_has_deal THEN v_score := v_score + 15; END IF;
  
  SELECT EXISTS (SELECT 1 FROM proposals p JOIN deals d ON d.id = p.deal_id WHERE d.company_id = p_company_id) INTO v_has_proposal;
  IF v_has_proposal THEN v_score := v_score + 15; END IF;
  
  -- 4. Score por contatos (máx 10 pontos)
  SELECT EXISTS (SELECT 1 FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL) INTO v_has_contact;
  IF v_has_contact THEN v_score := v_score + 10; END IF;
  
  -- 5. Score RFM se existir (máx 10 pontos) - CORRIGIDO: usa combined_score
  SELECT COALESCE(combined_score, 0) INTO v_rfm_score FROM company_rfm_scores WHERE company_id = p_company_id;
  v_score := v_score + LEAST(COALESCE(v_rfm_score, 0)::int, 10);
  
  -- Atualizar empresa
  UPDATE companies SET 
    lead_score = v_score,
    lead_score_updated_at = NOW()
  WHERE id = p_company_id;
  
  RETURN v_score;
END;
$function$
