-- Painel de automacoes/notificacoes para o admin.
-- As tabelas base liberavam leitura apenas para o proprio dono, entao o painel
-- administrativo via 5 de 59 regras de automacao e nenhum lembrete dos outros usuarios.
-- Abaixo: SOMENTE leitura, SOMENTE papel admin. Escrita e leitura por dono intactas.
-- Guarda por `to_regclass` pelo mesmo motivo da 20261126160000 (tabelas com drift).

DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY['automation_rules', 'notifications', 'reminders']
  LOOP
    IF to_regclass('public.' || tabela) IS NULL THEN
      RAISE NOTICE 'tabela % ausente neste banco, policy ignorada', tabela;
      CONTINUE;
    END IF;

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', tabela || '_select_admin', tabela);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), ''admin''::public.app_role))',
      tabela || '_select_admin', tabela
    );
  END LOOP;
END
$$;