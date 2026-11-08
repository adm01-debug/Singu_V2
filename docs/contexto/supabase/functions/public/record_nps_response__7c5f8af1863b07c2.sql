CREATE OR REPLACE FUNCTION public.record_nps_response(p_survey_id uuid, p_score integer, p_feedback text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT company_id INTO v_company_id FROM nps_surveys WHERE id = p_survey_id;

  -- Only block if the survey is linked to a company that belongs to a different user
  IF auth.uid() IS NOT NULL AND v_company_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM companies WHERE id = v_company_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: NPS survey % does not belong to the current user', p_survey_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE nps_surveys SET
    score        = p_score,
    feedback     = p_feedback,
    responded_at = NOW()
  WHERE id = p_survey_id AND score IS NULL;
  RETURN FOUND;
END;
$function$
