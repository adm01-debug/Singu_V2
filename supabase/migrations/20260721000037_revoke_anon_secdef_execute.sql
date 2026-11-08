-- Migration: revoke_anon_secdef_execute (Wave 123)
-- 7 SECURITY DEFINER functions were callable by the unauthenticated `anon`
-- role via the REST API. None of them should be publicly accessible without
-- authentication. Revoking EXECUTE from anon closes the attack surface.
-- (Authenticated users retain access where needed.)

DO $migration$
DECLARE
  function_signature text;
BEGIN
  FOREACH function_signature IN ARRAY ARRAY[
    'public.create_deal(uuid,text,numeric,text,date,uuid)',
    'public.fn_cf_collect_sm_legacy_dispatch(integer,integer)',
    'public.fn_cf_collect_sm_legacy_harvest(bigint,bigint)',
    'public.fn_ingest_asia_hg_batch(jsonb)',
    'public.fn_set_novelty_updated_at()',
    'public.fn_sm_promote_images_to_gold(integer)',
    'public.fn_sync_novelty_to_product()'
  ]
  LOOP
    IF to_regprocedure(function_signature) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon', function_signature);
    END IF;
  END LOOP;
END;
$migration$;
