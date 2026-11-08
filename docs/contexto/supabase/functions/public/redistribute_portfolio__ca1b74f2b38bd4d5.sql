CREATE OR REPLACE FUNCTION public.redistribute_portfolio(p_from_user_id uuid, p_to_user_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_companies int;
  v_per_user int;
  v_redistributed int := 0;
  v_company RECORD;
  v_target_idx int := 1;
BEGIN
  PERFORM public.assert_self_user_id(p_from_user_id);
  -- Contar empresas a redistribuir
  SELECT COUNT(*) INTO v_total_companies
  FROM companies
  WHERE user_id = p_from_user_id AND deleted_at IS NULL;
  
  IF v_total_companies = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhuma empresa para redistribuir');
  END IF;
  
  IF array_length(p_to_user_ids, 1) IS NULL OR array_length(p_to_user_ids, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum usuário de destino especificado');
  END IF;
  
  -- Distribuir igualmente
  FOR v_company IN 
    SELECT id FROM companies 
    WHERE user_id = p_from_user_id AND deleted_at IS NULL
    ORDER BY created_at
  LOOP
    UPDATE companies SET 
      user_id = p_to_user_ids[v_target_idx],
      updated_at = NOW()
    WHERE id = v_company.id;
    
    v_redistributed := v_redistributed + 1;
    v_target_idx := (v_target_idx % array_length(p_to_user_ids, 1)) + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'from_user', p_from_user_id,
    'to_users', p_to_user_ids,
    'total_redistributed', v_redistributed
  );
END;
$function$
