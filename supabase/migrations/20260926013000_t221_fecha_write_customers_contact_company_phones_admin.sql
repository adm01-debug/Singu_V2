-- Gap encontrado na auditoria pós-PR#62: aquela PR restringiu só o SELECT de customers/
-- contact_phones/company_phones a admin. INSERT/UPDATE/DELETE ficaram com qual/with_check
-- = "auth.uid() IS NOT NULL" -- qualquer usuário logado insere/edita/apaga qualquer linha
-- das 3 tabelas (~48 mil clientes), inclusive setando vendedor_id livremente, contornando
-- o motor de rodízio. Confirmado sem impacto: registrar_pedido_erp (ERP) só faz UPDATE em
-- customer já existente e roda como service_role (RLS não se aplica); front-end não tem
-- nenhum .from(...) direto pra essas 3 tabelas; external-data grava contact_phones/
-- company_phones via service_role (também bypassa RLS). Mesmo padrão has_role já usado em
-- customers_select.

DO $migration$
DECLARE
  policy_definition record;
  clauses text;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('customers', 'customers_insert', false, true),
      ('customers', 'customers_update', true, true),
      ('customers', 'customers_delete', true, false),
      ('contact_phones', 'contact_phones_insert', false, true),
      ('contact_phones', 'contact_phones_update', true, true),
      ('contact_phones', 'contact_phones_delete', true, false),
      ('company_phones', 'company_phones_insert', false, true),
      ('company_phones', 'company_phones_update', true, true),
      ('company_phones', 'company_phones_delete', true, false)
    ) AS policies(table_name, policy_name, use_using, use_check)
  LOOP
    IF to_regclass(format('public.%I', policy_definition.table_name)) IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = to_regclass(format('public.%I', policy_definition.table_name))
          AND polname = policy_definition.policy_name
      )
    THEN
      clauses := '';
      IF policy_definition.use_using THEN
        clauses := clauses || ' USING (has_role(auth.uid(), ''admin''::app_role))';
      END IF;
      IF policy_definition.use_check THEN
        clauses := clauses || ' WITH CHECK (has_role(auth.uid(), ''admin''::app_role))';
      END IF;

      EXECUTE format(
        'ALTER POLICY %I ON public.%I%s',
        policy_definition.policy_name,
        policy_definition.table_name,
        clauses
      );
    END IF;
  END LOOP;
END;
$migration$;
