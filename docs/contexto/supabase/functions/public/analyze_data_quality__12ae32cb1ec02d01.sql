CREATE OR REPLACE FUNCTION public.analyze_data_quality()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'checked_at', NOW(),
    'companies', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'missing_cnpj', (SELECT COUNT(*) FROM companies WHERE cnpj IS NULL AND deleted_at IS NULL),
      'missing_ramo', (SELECT COUNT(*) FROM companies WHERE ramo_atividade IS NULL AND deleted_at IS NULL),
      'missing_user', (SELECT COUNT(*) FROM companies WHERE user_id IS NULL AND deleted_at IS NULL),
      'quality_score', (
        SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE cnpj IS NOT NULL AND ramo_atividade IS NOT NULL) / NULLIF(COUNT(*), 0), 1)
        FROM companies WHERE deleted_at IS NULL
      )
    ),
    'contacts', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'without_name', (SELECT COUNT(*) FROM contacts WHERE full_name IS NULL AND deleted_at IS NULL),
      'duplicates_marked', (SELECT COUNT(*) FROM contacts WHERE is_duplicate = TRUE)
    ),
    'interactions', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM interactions),
      'without_company', (SELECT COUNT(*) FROM interactions WHERE company_id IS NULL),
      'without_type', (SELECT COUNT(*) FROM interactions WHERE type IS NULL)
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$function$
