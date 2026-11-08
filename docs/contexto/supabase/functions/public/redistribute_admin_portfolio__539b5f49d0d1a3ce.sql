CREATE OR REPLACE FUNCTION public.redistribute_admin_portfolio(p_admin_id uuid, p_target_users uuid[], p_batch_size integer DEFAULT 1000)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_companies int;
  v_redistributed int := 0;
  v_target_idx int := 1;
  v_company RECORD;
  v_per_user jsonb := '{}'::jsonb;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Validar
  IF array_length(p_target_users, 1) IS NULL OR array_length(p_target_users, 1) = 0 THEN
    RETURN jsonb_build_object('error', 'Nenhum usuário de destino informado');
  END IF;
  
  -- Contar
  SELECT COUNT(*) INTO v_total_companies
  FROM companies WHERE user_id = p_admin_id AND deleted_at IS NULL;
  
  -- Redistribuir em lote
  FOR v_company IN 
    SELECT id FROM companies 
    WHERE user_id = p_admin_id AND deleted_at IS NULL
    ORDER BY created_at
    LIMIT p_batch_size
  LOOP
    UPDATE companies SET 
      user_id = p_target_users[v_target_idx],
      updated_at = NOW()
    WHERE id = v_company.id;
    
    -- Contar por usuário
    v_per_user := v_per_user || jsonb_build_object(
      p_target_users[v_target_idx]::text, 
      COALESCE((v_per_user->>p_target_users[v_target_idx]::text)::int, 0) + 1
    );
    
    v_redistributed := v_redistributed + 1;
    v_target_idx := (v_target_idx % array_length(p_target_users, 1)) + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'from_user', p_admin_id,
    'total_available', v_total_companies,
    'redistributed_this_batch', v_redistributed,
    'remaining', v_total_companies - v_redistributed,
    'distribution', v_per_user
  );
END;
$function$
