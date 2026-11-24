CREATE OR REPLACE FUNCTION public.submit_public_csat_survey(_token uuid, _score integer, _feedback text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _id uuid;
  _type text;
BEGIN
  IF _token IS NULL OR _score IS NULL THEN
    RAISE EXCEPTION 'pesquisa ou nota inválida' USING ERRCODE = '22023';
  END IF;
  SELECT id, survey_type INTO _id, _type FROM public.csat_surveys
  WHERE public_token = _token AND status IN ('pending', 'sent')
    AND (expires_at IS NULL OR expires_at > now()) FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF _type IS NULL OR _type NOT IN ('csat', 'nps', 'ces') THEN
    RAISE EXCEPTION 'tipo de pesquisa sem escala pública configurada' USING ERRCODE = '22023';
  END IF;
  IF (_type = 'csat' AND _score NOT BETWEEN 1 AND 5)
    OR (_type = 'nps' AND _score NOT BETWEEN 0 AND 10)
    OR (_type = 'ces' AND _score NOT BETWEEN 1 AND 7) THEN
    RAISE EXCEPTION 'nota fora da escala da pesquisa' USING ERRCODE = '22023';
  END IF;
  UPDATE public.csat_surveys SET
    score = CASE WHEN _type = 'csat' THEN _score ELSE score END,
    nps_score = CASE WHEN _type = 'nps' THEN _score ELSE nps_score END,
    ces_score = CASE WHEN _type = 'ces' THEN _score ELSE ces_score END,
    feedback = nullif(left(btrim(coalesce(_feedback, '')), 1000), ''),
    status = 'answered', answered_at = now()
  WHERE id = _id;
  RETURN true;
END;
$function$
