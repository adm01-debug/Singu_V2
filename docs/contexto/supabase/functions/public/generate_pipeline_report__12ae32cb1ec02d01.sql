CREATE OR REPLACE FUNCTION public.generate_pipeline_report()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_deals', (SELECT COUNT(*) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'total_value', (SELECT COALESCE(SUM(valor), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'weighted_value', (SELECT COALESCE(SUM(valor * COALESCE(probabilidade, 50) / 100), 0) FROM deals WHERE status NOT IN ('ganho', 'perdido')),
    'generated_at', NOW()
  );
END;
$function$
