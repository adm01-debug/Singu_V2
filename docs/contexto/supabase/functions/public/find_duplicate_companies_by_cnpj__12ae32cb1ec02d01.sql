CREATE OR REPLACE FUNCTION public.find_duplicate_companies_by_cnpj()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_dup RECORD;
  v_count int := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  FOR v_dup IN
    SELECT c1.id as id1, c2.id as id2, c1.cnpj
    FROM companies c1
    JOIN companies c2 ON c1.cnpj = c2.cnpj AND c1.id < c2.id
    WHERE c1.cnpj IS NOT NULL AND c1.deleted_at IS NULL AND c2.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM duplicate_candidates dc 
        WHERE dc.entity_type = 'company' 
          AND ((dc.entity_1_id = c1.id AND dc.entity_2_id = c2.id) OR (dc.entity_1_id = c2.id AND dc.entity_2_id = c1.id))
      )
  LOOP
    INSERT INTO duplicate_candidates (entity_type, entity_1_id, entity_2_id, similarity_score, match_fields)
    VALUES ('company', v_dup.id1, v_dup.id2, 100, ARRAY['cnpj'])
    ON CONFLICT DO NOTHING;
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$function$
