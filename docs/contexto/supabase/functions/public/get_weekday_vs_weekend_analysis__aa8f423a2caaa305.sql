CREATE OR REPLACE FUNCTION public.get_weekday_vs_weekend_analysis(p_days integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'periodo_dias', p_days,
    'dias_uteis', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval AND EXTRACT(DOW FROM created_at) BETWEEN 1 AND 5),
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - (p_days || ' days')::interval AND EXTRACT(DOW FROM created_at) BETWEEN 1 AND 5 AND deleted_at IS NULL)
    ),
    'fim_semana', jsonb_build_object(
      'interacoes', (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval AND EXTRACT(DOW FROM created_at) IN (0, 6)),
      'empresas', (SELECT COUNT(*) FROM companies WHERE created_at >= now() - (p_days || ' days')::interval AND EXTRACT(DOW FROM created_at) IN (0, 6) AND deleted_at IS NULL)
    ),
    'percentual_fim_semana', ROUND(
      (SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval AND EXTRACT(DOW FROM created_at) IN (0, 6))::numeric /
      NULLIF((SELECT COUNT(*) FROM interactions WHERE created_at >= now() - (p_days || ' days')::interval), 0) * 100, 2
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
