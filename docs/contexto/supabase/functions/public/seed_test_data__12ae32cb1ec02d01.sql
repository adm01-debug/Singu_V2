CREATE OR REPLACE FUNCTION public.seed_test_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb := '{}'::jsonb;
  v_user_id uuid;
  v_company_id uuid;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Obter IDs para teste
  SELECT id INTO v_user_id FROM profiles WHERE is_active = true LIMIT 1;
  SELECT id INTO v_company_id FROM companies WHERE deleted_at IS NULL LIMIT 1;
  
  IF v_user_id IS NULL OR v_company_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Não há usuários ou empresas para teste');
  END IF;
  
  -- Criar notificação de teste
  INSERT INTO notifications (user_id, type, title, message, entity_type, entity_id)
  VALUES (v_user_id, 'info', 'Bem-vindo ao CRM Singu!', 'Sistema configurado com sucesso.', 'system', NULL)
  ON CONFLICT DO NOTHING;
  
  -- Criar meta de teste
  INSERT INTO user_goals (user_id, goal_type, target_value, current_value, period_start, period_end)
  VALUES (v_user_id, 'interactions', 100, 0, DATE_TRUNC('month', CURRENT_DATE), DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
  ON CONFLICT DO NOTHING;
  
  -- Criar tarefa de teste
  INSERT INTO tasks (user_id, company_id, title, description, task_type, priority, due_date)
  VALUES (v_user_id, v_company_id, 'Follow-up inicial', 'Entrar em contato para apresentação', 'follow_up', 'medium', CURRENT_DATE + 3)
  ON CONFLICT DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'company_id', v_company_id,
    'seeded_at', NOW()
  );
END;
$function$
