CREATE OR REPLACE FUNCTION public.evaluate_mql(_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _criterion RECORD;
  _matched UUID;
  _score INT := 0;
  _classification_id UUID;
  _result JSONB;
BEGIN
  SELECT COALESCE((SELECT ls.total_score::int FROM public.lead_scores ls
                    WHERE ls.contact_id = c.id AND ls.user_id = c.user_id
                    ORDER BY ls.calculated_at DESC NULLS LAST LIMIT 1), 0)
    INTO _score
    FROM public.contacts c
   WHERE c.id = _contact_id AND c.user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contact not found';
  END IF;

  FOR _criterion IN
    SELECT * FROM public.mql_criteria
    WHERE user_id = auth.uid() AND is_active = true
    ORDER BY priority DESC, created_at ASC
  LOOP
    -- Simple evaluation: condition object {min_score:int, required_tags:[]}
    IF (_criterion.conditions->>'min_score')::INT IS NULL OR _score >= (_criterion.conditions->>'min_score')::INT THEN
      _matched := _criterion.id;
      EXIT;
    END IF;
  END LOOP;

  IF _matched IS NULL THEN
    RETURN jsonb_build_object('qualified', false, 'score', _score);
  END IF;

  INSERT INTO public.mql_classifications (user_id, contact_id, criteria_id, status, score_snapshot, reason)
  VALUES (auth.uid(), _contact_id, _matched, 'mql', _score, 'Auto-evaluated')
  ON CONFLICT DO NOTHING
  RETURNING id INTO _classification_id;

  IF _classification_id IS NULL THEN
    SELECT id INTO _classification_id FROM public.mql_classifications
    WHERE user_id = auth.uid() AND contact_id = _contact_id
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'qualified', true,
    'score', _score,
    'criteria_id', _matched,
    'classification_id', _classification_id
  );
END;
$function$
