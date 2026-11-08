CREATE OR REPLACE FUNCTION public.register_nps_response(p_company_id uuid, p_score integer, p_feedback text DEFAULT NULL::text, p_contact_id uuid DEFAULT NULL::uuid, p_sent_by uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_survey_id uuid;
  v_category text;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  -- Determinar categoria
  v_category := CASE
    WHEN p_score >= 9 THEN 'promoter'
    WHEN p_score >= 7 THEN 'passive'
    ELSE 'detractor'
  END;
  
  INSERT INTO customer_surveys (
    company_id, contact_id, survey_type, score, feedback, category, sent_by, responded_at
  ) VALUES (
    p_company_id, p_contact_id, 'nps', p_score, p_feedback, v_category, p_sent_by, now()
  )
  RETURNING id INTO v_survey_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'survey_id', v_survey_id,
    'score', p_score,
    'category', v_category
  );
END;
$function$
