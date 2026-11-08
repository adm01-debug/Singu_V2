CREATE OR REPLACE FUNCTION public.get_sla_monitoring()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'followup_sla', jsonb_build_object(
      'dentro_prazo', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup >= now()),
      'atrasados_1_dia', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup < now() AND data_followup >= now() - interval '1 day'),
      'atrasados_3_dias', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup < now() - interval '1 day' AND data_followup >= now() - interval '3 days'),
      'atrasados_mais_3_dias', (SELECT COUNT(*) FROM interactions WHERE followup_pendente = true AND data_followup < now() - interval '3 days')
    ),
    'alerta_sla', jsonb_build_object(
      'pendentes_hoje', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL AND created_at::date = CURRENT_DATE),
      'pendentes_ontem', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL AND created_at::date = CURRENT_DATE - 1),
      'pendentes_mais_antigos', (SELECT COUNT(*) FROM alerts WHERE resolved_at IS NULL AND created_at < now() - interval '2 days')
    ),
    'tempo_medio_resolucao_alertas_horas', (
      SELECT ROUND(EXTRACT(EPOCH FROM AVG(resolved_at - created_at)) / 3600, 2)
      FROM alerts WHERE resolved_at IS NOT NULL AND resolved_at >= now() - interval '30 days'
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
