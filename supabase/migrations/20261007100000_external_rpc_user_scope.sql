-- RPCs chamadas por usuários via edge function external-data passam a rodar
-- com o JWT do usuário (role authenticated), e não mais com a service role.
-- Os guards assert_* são SECURITY INVOKER: sob RLS só enxergam linhas do
-- próprio usuário, então EXECUTE para authenticated não permite sondar posse
-- de registros alheios. Guards SECURITY DEFINER, se existirem, ficam de fora.
DO $$
DECLARE
  f regprocedure;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname LIKE 'assert\_%'
      AND NOT p.prosecdef
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;

  IF to_regprocedure('public.get_instant_kpis(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.get_instant_kpis(uuid) SECURITY INVOKER;
    REVOKE ALL ON FUNCTION public.get_instant_kpis(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.get_instant_kpis(uuid) TO authenticated, service_role;
  END IF;
END $$;
