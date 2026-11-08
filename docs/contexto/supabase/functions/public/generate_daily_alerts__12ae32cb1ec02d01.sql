CREATE OR REPLACE FUNCTION public.generate_daily_alerts()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_alerts jsonb := '[]'::jsonb;
  v_user RECORD;
  v_count int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Para cada usuário ativo
  FOR v_user IN SELECT id, COALESCE(full_name, email) as nome FROM profiles WHERE is_active = true
  LOOP
    -- Alerta: Follow-ups atrasados
    SELECT COUNT(*) INTO v_count
    FROM interactions i
    JOIN companies c ON c.id = i.company_id
    WHERE c.user_id = v_user.id
      AND i.follow_up_date < CURRENT_DATE
      AND COALESCE(i.followup_concluido, false) = false;
    
    IF v_count > 0 THEN
      INSERT INTO notifications (user_id, type, title, message, entity_type, priority)
      VALUES (v_user.id, 'warning', 'Follow-ups Atrasados', 
        'Você tem ' || v_count || ' follow-ups atrasados. Regularize hoje!', 
        'interaction', 'high')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Alerta: Tarefas vencidas
    SELECT COUNT(*) INTO v_count
    FROM tasks
    WHERE user_id = v_user.id
      AND due_date < CURRENT_DATE
      AND status = 'pending';
    
    IF v_count > 0 THEN
      INSERT INTO notifications (user_id, type, title, message, entity_type, priority)
      VALUES (v_user.id, 'warning', 'Tarefas Vencidas', 
        'Você tem ' || v_count || ' tarefas vencidas. Revise suas prioridades!', 
        'task', 'high')
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Alerta: Deals parados (sem atualização há 7+ dias)
    SELECT COUNT(*) INTO v_count
    FROM deals d
    WHERE d.user_id = v_user.id
      AND d.status NOT IN ('ganho', 'perdido', 'arquivado')
      AND d.updated_at < NOW() - INTERVAL '7 days';
    
    IF v_count > 0 THEN
      INSERT INTO notifications (user_id, type, title, message, entity_type, priority)
      VALUES (v_user.id, 'info', 'Deals Parados', 
        v_count || ' deals sem movimentação há mais de 7 dias.', 
        'deal', 'medium')
      ON CONFLICT DO NOTHING;
    END IF;
    
    v_alerts := v_alerts || jsonb_build_object('user_id', v_user.id, 'nome', v_user.nome);
  END LOOP;
  
  RETURN jsonb_build_object('users_processed', jsonb_array_length(v_alerts), 'generated_at', NOW());
END;
$function$
