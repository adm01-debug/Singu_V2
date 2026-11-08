CREATE OR REPLACE FUNCTION public.generate_morning_briefing(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  SELECT jsonb_build_object(
    'user_id', p_user_id,
    'generated_at', NOW(),
    'prioridades_hoje', (
      SELECT jsonb_agg(jsonb_build_object(
        'tipo', 'callback',
        'empresa', company_name,
        'horario', scheduled_date,
        'assunto', assunto
      ))
      FROM get_pending_callbacks(p_user_id, FALSE)
      WHERE scheduled_date::DATE = CURRENT_DATE
      LIMIT 10
    ),
    'followups_atrasados', (
      SELECT jsonb_agg(jsonb_build_object(
        'empresa', company_name,
        'dias_atraso', days_overdue,
        'assunto', assunto
      ))
      FROM get_overdue_followups(p_user_id, 0)
      LIMIT 5
    ),
    'aniversarios_semana', (
      SELECT jsonb_agg(jsonb_build_object(
        'contato', contact_name,
        'empresa', company_name,
        'data', birthday,
        'dias_ate', days_until
      ))
      FROM get_birthday_alerts(7, p_user_id)
      LIMIT 5
    ),
    'contas_risco', (
      SELECT jsonb_agg(jsonb_build_object(
        'empresa', company_name,
        'score', risk_score,
        'fatores', risk_factors
      ))
      FROM get_at_risk_accounts(p_user_id, 5)
    ),
    'metricas', get_daily_alerts_summary(p_user_id)
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
