CREATE OR REPLACE FUNCTION public.get_data_quality_score()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_companies int;
  v_with_cnpj int;
  v_with_email int;
  v_with_phone int;
  v_with_contact int;
  v_with_interaction int;
  v_score numeric;
BEGIN
  SELECT COUNT(*) INTO v_total_companies FROM companies WHERE deleted_at IS NULL;
  SELECT COUNT(*) INTO v_with_cnpj FROM companies WHERE deleted_at IS NULL AND cnpj IS NOT NULL AND cnpj != '';
  SELECT COUNT(*) INTO v_with_email FROM companies c WHERE c.deleted_at IS NULL AND EXISTS (SELECT 1 FROM company_emails WHERE company_id = c.id);
  SELECT COUNT(*) INTO v_with_phone FROM companies c WHERE c.deleted_at IS NULL AND EXISTS (SELECT 1 FROM company_phones WHERE company_id = c.id);
  SELECT COUNT(*) INTO v_with_contact FROM companies c WHERE c.deleted_at IS NULL AND EXISTS (SELECT 1 FROM contacts WHERE company_id = c.id);
  SELECT COUNT(*) INTO v_with_interaction FROM companies c WHERE c.deleted_at IS NULL AND EXISTS (SELECT 1 FROM interactions WHERE company_id = c.id);
  
  v_score := (
    (v_with_cnpj::numeric / NULLIF(v_total_companies, 0) * 20) +
    (v_with_email::numeric / NULLIF(v_total_companies, 0) * 20) +
    (v_with_phone::numeric / NULLIF(v_total_companies, 0) * 20) +
    (v_with_contact::numeric / NULLIF(v_total_companies, 0) * 20) +
    (v_with_interaction::numeric / NULLIF(v_total_companies, 0) * 20)
  );
  
  RETURN jsonb_build_object(
    'total_companies', v_total_companies,
    'with_cnpj', v_with_cnpj,
    'with_email', v_with_email,
    'with_phone', v_with_phone,
    'with_contact', v_with_contact,
    'with_interaction', v_with_interaction,
    'completeness_score', ROUND(v_score, 1),
    'grade', CASE WHEN v_score >= 90 THEN 'A' WHEN v_score >= 80 THEN 'B' WHEN v_score >= 70 THEN 'C' WHEN v_score >= 60 THEN 'D' ELSE 'F' END
  );
END;
$function$
