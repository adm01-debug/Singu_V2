CREATE OR REPLACE FUNCTION public.get_lead_grade_distribution()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (
    SELECT jsonb_build_object(
      'grade_a', COUNT(*) FILTER (WHERE COALESCE(lead_score, 0) >= 80),
      'grade_b', COUNT(*) FILTER (WHERE COALESCE(lead_score, 0) >= 60 AND COALESCE(lead_score, 0) < 80),
      'grade_c', COUNT(*) FILTER (WHERE COALESCE(lead_score, 0) >= 40 AND COALESCE(lead_score, 0) < 60),
      'grade_d', COUNT(*) FILTER (WHERE COALESCE(lead_score, 0) >= 20 AND COALESCE(lead_score, 0) < 40),
      'grade_f', COUNT(*) FILTER (WHERE COALESCE(lead_score, 0) < 20),
      'total', COUNT(*),
      'avg_score', ROUND(AVG(COALESCE(lead_score, 0))::numeric, 1)
    )
    FROM companies
    WHERE deleted_at IS NULL AND status = 'ativo'
  );
END;
$function$
