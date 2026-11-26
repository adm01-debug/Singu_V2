-- Hardening: as views de clientes são somente leitura.
-- security_invoker=true garante que a RLS de companies/customers se aplica ao usuário,
-- mas o grant herdado permitia INSERT/UPDATE/DELETE via PostgREST.
DO $$
DECLARE
  alvo text;
BEGIN
  FOREACH alvo IN ARRAY ARRAY[
    'vw_cliente_completo',
    'vw_status_clientes',
    'vw_empresas_hierarquia',
    'vw_cooperativas_estrutura',
    'vw_empresa_historico_completo'
  ] LOOP
    IF to_regclass('public.' || alvo) IS NULL THEN
      RAISE NOTICE 'view ausente, ignorando: %', alvo;
      CONTINUE;
    END IF;
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', alvo);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', alvo);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', alvo);
  END LOOP;
END
$$;