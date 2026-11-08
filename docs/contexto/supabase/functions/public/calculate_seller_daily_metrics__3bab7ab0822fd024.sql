CREATE OR REPLACE FUNCTION public.calculate_seller_daily_metrics(p_user_id uuid, p_date date DEFAULT CURRENT_DATE)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_metrics jsonb;
  v_interactions_count integer;
  v_calls integer;
  v_emails integer;
  v_whatsapp integer;
  v_meetings integer;
  v_deals_created integer;
  v_deals_won integer;
  v_deals_lost integer;
  v_revenue numeric;
  v_new_companies integer;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Interações
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE type = 'call'),
    COUNT(*) FILTER (WHERE type = 'email'),
    COUNT(*) FILTER (WHERE type = 'whatsapp'),
    COUNT(*) FILTER (WHERE type = 'meeting')
  INTO v_interactions_count, v_calls, v_emails, v_whatsapp, v_meetings
  FROM interactions
  WHERE user_id = p_user_id
    AND data_interacao::date = p_date;
  
  -- Deals
  SELECT 
    COUNT(*) FILTER (WHERE created_at::date = p_date),
    COUNT(*) FILTER (WHERE status = 'ganho' AND closed_at::date = p_date),
    COUNT(*) FILTER (WHERE status = 'perdido' AND closed_at::date = p_date),
    COALESCE(SUM(valor) FILTER (WHERE status = 'ganho' AND closed_at::date = p_date), 0)
  INTO v_deals_created, v_deals_won, v_deals_lost, v_revenue
  FROM deals
  WHERE user_id = p_user_id;
  
  -- Novas empresas
  SELECT COUNT(*) INTO v_new_companies
  FROM companies
  WHERE user_id = p_user_id
    AND created_at::date = p_date
    AND deleted_at IS NULL;
  
  -- Salvar métricas
  INSERT INTO seller_daily_metrics (
    user_id, metric_date, interactions_count, calls_count, emails_count,
    whatsapp_count, meetings_count, deals_created, deals_won, deals_lost,
    revenue_generated, new_companies
  ) VALUES (
    p_user_id, p_date, v_interactions_count, v_calls, v_emails,
    v_whatsapp, v_meetings, v_deals_created, v_deals_won, v_deals_lost,
    v_revenue, v_new_companies
  )
  ON CONFLICT (user_id, metric_date) DO UPDATE SET
    interactions_count = v_interactions_count,
    calls_count = v_calls,
    emails_count = v_emails,
    whatsapp_count = v_whatsapp,
    meetings_count = v_meetings,
    deals_created = v_deals_created,
    deals_won = v_deals_won,
    deals_lost = v_deals_lost,
    revenue_generated = v_revenue,
    new_companies = v_new_companies;
  
  RETURN jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'date', p_date,
    'interactions', v_interactions_count,
    'calls', v_calls,
    'deals_won', v_deals_won,
    'revenue', v_revenue
  );
END;
$function$
