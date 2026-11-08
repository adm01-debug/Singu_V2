CREATE OR REPLACE FUNCTION public.fn_cf_collect_sm_legacy_harvest(p_first_id bigint, p_last_id bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'net'
AS $function$
DECLARE
  v_total_responses integer;
  v_pending integer;
  v_inserted integer := 0;
  v_pages_with_sm integer := 0;
  v_pages_total integer := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Contar respostas disponíveis no range
  SELECT COUNT(*) INTO v_total_responses 
  FROM net._http_response 
  WHERE id BETWEEN p_first_id AND p_last_id;
  
  v_pending := (p_last_id - p_first_id + 1) - v_total_responses;
  
  -- Inserir as sm-* das respostas 200 OK
  WITH responses AS (
    SELECT id, status_code, content::jsonb AS body
    FROM net._http_response 
    WHERE id BETWEEN p_first_id AND p_last_id
      AND status_code = 200
  ),
  images_raw AS (
    SELECT 
      r.id AS response_id,
      img->>'id' AS cf_id,
      img->>'filename' AS filename,
      (img->>'uploaded')::timestamptz AS uploaded_at
    FROM responses r,
         jsonb_array_elements(r.body->'result'->'images') AS img
    WHERE img->>'id' LIKE 'sm-%'
  ),
  inserted AS (
    INSERT INTO cf_sm_legacy (cf_id, filename, uploaded_at)
    SELECT cf_id, filename, uploaded_at FROM images_raw
    ON CONFLICT (cf_id) DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_inserted FROM inserted;
  
  -- Pages com SM
  SELECT COUNT(DISTINCT r.id) INTO v_pages_with_sm
  FROM net._http_response r,
       jsonb_array_elements((r.content::jsonb)->'result'->'images') AS img
  WHERE r.id BETWEEN p_first_id AND p_last_id
    AND r.status_code = 200
    AND img->>'id' LIKE 'sm-%';
  
  v_pages_total := v_total_responses;
  
  RETURN jsonb_build_object(
    'responses_received', v_total_responses,
    'pending_responses', v_pending,
    'pages_total_processed', v_pages_total,
    'pages_with_sm', v_pages_with_sm,
    'inserted_this_call', v_inserted,
    'cf_sm_legacy_total_now', (SELECT COUNT(*) FROM cf_sm_legacy)
  );
END;
$function$
