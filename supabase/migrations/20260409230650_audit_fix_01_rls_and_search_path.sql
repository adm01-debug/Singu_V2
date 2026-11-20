-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230650
-- nome:   audit_fix_01_rls_and_search_path

-- F3: RLS nas 3 tabelas dicionário (leitura pública, escrita admin)
ALTER TABLE zapp_history.location_dictionary ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.disc_playbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE zapp_history.product_dictionary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pub_read_location" ON zapp_history.location_dictionary FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admin_write_location" ON zapp_history.location_dictionary FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "pub_read_playbook" ON zapp_history.disc_playbook FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admin_write_playbook" ON zapp_history.disc_playbook FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "pub_read_products" ON zapp_history.product_dictionary FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "admin_write_products" ON zapp_history.product_dictionary FOR ALL TO service_role USING (true) WITH CHECK (true);

-- F4: search_path fixo em TODAS as funções SECURITY DEFINER do schema (via ALTER FUNCTION em lote)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    WHERE p.pronamespace='zapp_history'::regnamespace
      AND p.prosecdef=true
      AND NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%')
  LOOP
    EXECUTE 'ALTER FUNCTION ' || r.sig || ' SET search_path = zapp_history, public, pg_temp';
  END LOOP;
END $$;

-- Verificação
SELECT
  (SELECT COUNT(*) FROM pg_tables t
   WHERE t.schemaname='zapp_history'
     AND EXISTS (SELECT 1 FROM pg_class c WHERE c.relname=t.tablename AND c.relnamespace='zapp_history'::regnamespace AND c.relrowsecurity)
  ) AS tabelas_com_rls,
  (SELECT COUNT(*) FROM pg_proc p
   WHERE p.pronamespace='zapp_history'::regnamespace AND p.prosecdef=true
     AND NOT EXISTS (SELECT 1 FROM unnest(p.proconfig) cfg WHERE cfg LIKE 'search_path=%')
  ) AS funcoes_sem_search_path_restantes;
