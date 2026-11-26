-- Eventos de cliente: vw_timeline_cliente exposta read-only para authenticated.
DO $$
BEGIN
  IF to_regclass('public.vw_timeline_cliente') IS NOT NULL THEN
    REVOKE ALL ON public.vw_timeline_cliente FROM anon;
    REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.vw_timeline_cliente FROM authenticated;
    GRANT SELECT ON public.vw_timeline_cliente TO authenticated;
    GRANT SELECT ON public.vw_timeline_cliente TO service_role;
  END IF;
END $$;