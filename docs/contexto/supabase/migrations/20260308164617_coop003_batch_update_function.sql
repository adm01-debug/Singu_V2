CREATE OR REPLACE FUNCTION coop003_batch_update(
  p_ids text[],
  p_cnpjs text[],
  p_metodos text[]
) RETURNS TABLE(updated_count int, skipped_count int) AS $$
DECLARE
  v_updated int := 0;
  v_skipped int := 0;
  i int;
BEGIN
  FOR i IN 1..array_length(p_ids, 1) LOOP
    UPDATE companies SET
      cnpj = p_cnpjs[i],
      merge_notes = to_jsonb(
        CONCAT(COALESCE(merge_notes #>> '{}', ''), '|COOP-003-T001:cnpj=' || p_cnpjs[i] || '|metodo=' || p_metodos[i])
      )
    WHERE id = p_ids[i]::uuid
      AND cnpj IS NULL;
    
    IF FOUND THEN
      v_updated := v_updated + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT v_updated, v_skipped;
END;
$$ LANGUAGE plpgsql;
