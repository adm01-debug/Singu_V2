-- Dívida técnica documentada em scripts/rls-matrix/rls-baseline.json (Fase 3): customers,
-- contact_phones e company_phones tinham SELECT liberado pra qualquer usuário authenticated
-- (auth.uid() IS NOT NULL), expondo ~48 mil clientes e telefones. Não há nenhum .from(...)
-- direto pra essas 3 tabelas no frontend (confirmado via grep) — todo acesso real passa por
-- RPC (que roda como service_role). Restringe SELECT a admin, mesmo padrão já usado nas
-- 4 tabelas do rodízio (admin_select / has_role).
DO $migration$
DECLARE
  policy_definition record;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('customers', 'customers_select'),
      ('contact_phones', 'contact_phones_select'),
      ('company_phones', 'company_phones_select')
    ) AS policies(table_name, policy_name)
  LOOP
    IF to_regclass(format('public.%I', policy_definition.table_name)) IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = to_regclass(format('public.%I', policy_definition.table_name))
          AND polname = policy_definition.policy_name
      )
    THEN
      EXECUTE format(
        'ALTER POLICY %I ON public.%I USING (has_role(auth.uid(), ''admin''::app_role))',
        policy_definition.policy_name,
        policy_definition.table_name
      );
    END IF;
  END LOOP;
END;
$migration$;
