CREATE OR REPLACE FUNCTION public.count_segment_companies(p_segment_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_segment RECORD;
  v_count int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_segment FROM smart_segments WHERE id = p_segment_id;
  
  SELECT COUNT(*) INTO v_count
  FROM companies c
  WHERE c.deleted_at IS NULL
    AND ((v_segment.filters->>'lead_score_min') IS NULL OR c.lead_score >= (v_segment.filters->>'lead_score_min')::int)
    AND ((v_segment.filters->>'status') IS NULL OR c.status = v_segment.filters->>'status')
    AND ((v_segment.filters->>'inactive_days') IS NULL OR NOT EXISTS (
      SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - ((v_segment.filters->>'inactive_days')::int || ' days')::interval
    ));
  
  -- Atualizar cache
  UPDATE smart_segments SET cached_count = v_count, last_calculated_at = NOW() WHERE id = p_segment_id;
  
  RETURN v_count;
END;
$function$
