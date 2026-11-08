CREATE OR REPLACE FUNCTION public.generate_smart_alerts(p_user_id uuid)
 RETURNS TABLE(alert_type text, priority text, message text, entity_id uuid, action_url text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  PERFORM public.assert_self_user_id(p_user_id);
  -- Deals parados
  RETURN QUERY SELECT 'deal_stalled'::text, 'ALTA'::text, 
    'Deal "' || d.titulo || '" parado há ' || EXTRACT(DAY FROM NOW() - d.updated_at)::int || ' dias',
    d.id, '/deals/' || d.id
  FROM deals d WHERE d.user_id = p_user_id AND d.status NOT IN ('ganho', 'perdido') AND d.updated_at < NOW() - interval '7 days';
  
  -- Lembretes atrasados
  RETURN QUERY SELECT 'reminder_overdue', 'ALTA',
    'Lembrete atrasado: ' || r.title, r.id, '/reminders'
  FROM reminders r WHERE r.user_id = p_user_id AND r.is_completed = false AND r.reminder_date < NOW();
  
  -- Meta em risco
  RETURN QUERY SELECT 'goal_at_risk', 'MÉDIA',
    'Meta de ' || g.goal_type || ' em risco (' || ROUND(g.current_value/NULLIF(g.target_value,0)*100) || '%)',
    g.id, '/goals'
  FROM user_goals g WHERE g.user_id = p_user_id AND g.period_end >= CURRENT_DATE 
    AND g.current_value < g.target_value * 0.5 AND g.period_end < CURRENT_DATE + interval '10 days';
  
  -- Clientes sem contato
  RETURN QUERY SELECT 'customer_inactive', 'MÉDIA',
    'Cliente ' || COALESCE(c.nome_fantasia, c.nome_crm) || ' sem contato há 30+ dias',
    c.id, '/companies/' || c.id
  FROM companies c WHERE c.user_id = p_user_id AND c.is_customer = true AND c.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days')
  LIMIT 5;
END;
$function$
