CREATE OR REPLACE FUNCTION public.get_public_csat_survey(_token uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _result jsonb;
BEGIN
  IF _token IS NULL THEN RETURN NULL; END IF;
  SELECT CASE
    WHEN s.expires_at IS NOT NULL AND s.expires_at <= now()
      THEN jsonb_build_object('id', s.id, 'expires_at', s.expires_at)
    ELSE jsonb_build_object(
      'id', s.id, 'survey_type', s.survey_type,
      'score', CASE s.survey_type WHEN 'nps' THEN s.nps_score WHEN 'ces' THEN s.ces_score ELSE s.score END,
      'rating_min', CASE s.survey_type WHEN 'nps' THEN 0 WHEN 'csat' THEN 1 WHEN 'ces' THEN 1 END,
      'rating_max', CASE s.survey_type WHEN 'nps' THEN 10 WHEN 'csat' THEN 5 WHEN 'ces' THEN 7 END,
      'feedback', s.feedback, 'status', s.status, 'channel', s.channel, 'expires_at', s.expires_at
    ) END
  INTO _result FROM public.csat_surveys s WHERE s.public_token = _token LIMIT 1;
  RETURN _result;
END;
$function$
