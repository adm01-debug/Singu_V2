CREATE OR REPLACE FUNCTION public.prioritize_daily_tasks(p_user_id uuid)
 RETURNS TABLE(priority integer, task_type text, description text, entity_id uuid, urgency text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- 1. Lembretes atrasados (máxima prioridade)
  RETURN QUERY SELECT 1, 'reminder'::text, 'Lembrete atrasado: ' || r.title, r.id, 'CRÍTICA'::text
  FROM reminders r WHERE r.user_id = p_user_id AND r.is_completed = false AND r.reminder_date < NOW() LIMIT 5;
  
  -- 2. Deals com previsão para hoje
  RETURN QUERY SELECT 2, 'deal', 'Fechamento previsto: ' || d.titulo, d.id, 'ALTA'
  FROM deals d WHERE d.user_id = p_user_id AND d.status NOT IN ('ganho', 'perdido') AND d.previsao_fechamento::date = CURRENT_DATE LIMIT 5;
  
  -- 3. Follow-ups do dia
  RETURN QUERY SELECT 3, 'followup', 'Follow-up: ' || LEFT(i.resumo, 50), i.id, 'ALTA'
  FROM interactions i WHERE i.user_id = p_user_id AND i.follow_up_date = CURRENT_DATE LIMIT 5;
  
  -- 4. Deals parados há 7+ dias
  RETURN QUERY SELECT 4, 'stalled_deal', 'Deal parado: ' || d.titulo, d.id, 'MÉDIA'
  FROM deals d WHERE d.user_id = p_user_id AND d.status NOT IN ('ganho', 'perdido') AND d.updated_at < NOW() - interval '7 days' LIMIT 5;
  
  -- 5. Hot leads sem contato recente
  RETURN QUERY SELECT 5, 'hot_lead', 'Hot lead: ' || COALESCE(c.nome_fantasia, c.nome_crm), c.id, 'MÉDIA'
  FROM companies c WHERE c.user_id = p_user_id AND c.deleted_at IS NULL AND calculate_conversion_probability(c.id) >= 50
    AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - interval '3 days') LIMIT 5;
END;
$function$
