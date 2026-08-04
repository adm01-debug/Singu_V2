DO $$
DECLARE
  v_company_id uuid := '390bed1e-961a-42bc-af37-e9a9f1d21c17';
  v_result jsonb;
BEGIN
  BEGIN
    SELECT public.get_unified_communication_history(v_company_id, 50) INTO v_result;
    RAISE NOTICE 'OK signature 1: % rows', jsonb_array_length(v_result);
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAIL signature 1: % %', SQLSTATE, SQLERRM;
  END;
END $$;
