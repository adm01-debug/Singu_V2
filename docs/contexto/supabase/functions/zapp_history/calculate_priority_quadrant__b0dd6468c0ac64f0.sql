CREATE OR REPLACE FUNCTION zapp_history.calculate_priority_quadrant(p_lead_score integer, p_sentiment text, p_churn_risk text, p_funnel_stage text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_urgent BOOLEAN;
  v_important BOOLEAN;
  v_quadrant TEXT;
  v_action TEXT;
BEGIN
  v_urgent := COALESCE(p_sentiment = 'urgent', FALSE)
           OR COALESCE(p_churn_risk IN ('alto','critico'), FALSE)
           OR COALESCE(p_funnel_stage IN ('negociacao','fechamento'), FALSE);
  v_important := COALESCE(p_lead_score, 0) >= 60;

  IF v_urgent AND v_important THEN
    v_quadrant := 'Q1_FAZER_AGORA';
    v_action := '🔥 Atender imediatamente. Lead alto valor + urgente.';
  ELSIF NOT v_urgent AND v_important THEN
    v_quadrant := 'Q2_AGENDAR';
    v_action := '📅 Lead importante mas não urgente. Agendar follow-up estratégico.';
  ELSIF v_urgent AND NOT v_important THEN
    v_quadrant := 'Q3_DELEGAR';
    v_action := '⚡ Urgente mas baixo valor. Delegar para SDR ou bot.';
  ELSE
    v_quadrant := 'Q4_AUTOMACAO';
    v_action := '🤖 Baixo valor + sem urgência. Resposta automática ou catálogo.';
  END IF;

  RETURN jsonb_build_object(
    'quadrant', v_quadrant,
    'urgent', v_urgent,
    'important', v_important,
    'action', v_action
  );
END;
$function$
