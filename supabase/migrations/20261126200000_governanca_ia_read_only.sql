-- Governança de IA: views herdadas expostas read-only para authenticated.
-- v_model_catalog, vw_reframe_suggestions e vw_recommended_scripts são views
-- security_invoker sobre tabelas de catálogo; não há motivo para DML via view.
DO $$
DECLARE
  v text;
BEGIN
  FOREACH v IN ARRAY ARRAY['v_model_catalog','vw_reframe_suggestions','vw_recommended_scripts']
  LOOP
    IF to_regclass('public.' || v) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON public.%I FROM anon', v);
      EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', v);
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', v);
      EXECUTE format('GRANT SELECT ON public.%I TO service_role', v);
    END IF;
  END LOOP;
END $$;