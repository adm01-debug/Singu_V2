CREATE OR REPLACE FUNCTION public.advance_lead_status(p_company_id uuid, p_new_status text, p_user_id uuid DEFAULT auth.uid())
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old_status text;
  v_valid_statuses text[] := ARRAY['novo', 'contatado', 'qualificando', 'qualificado', 'negociacao', 'proposta', 'fechamento', 'cliente', 'perdido'];
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  IF p_new_status != ALL(v_valid_statuses) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Status inválido. Válidos: ' || array_to_string(v_valid_statuses, ', '));
  END IF;
  
  SELECT lead_status INTO v_old_status FROM companies WHERE id = p_company_id;
  
  UPDATE companies SET 
    lead_status = p_new_status,
    updated_at = NOW()
  WHERE id = p_company_id;
  
  -- Log da mudança
  INSERT INTO interactions (company_id, type, channel, direction, resumo, user_id, data_interacao)
  VALUES (p_company_id, 'system', 'system', 'outbound', 'Status alterado de ' || COALESCE(v_old_status, 'null') || ' para ' || p_new_status, p_user_id, NOW());
  
  RETURN jsonb_build_object('success', true, 'old_status', v_old_status, 'new_status', p_new_status);
END;
$function$
