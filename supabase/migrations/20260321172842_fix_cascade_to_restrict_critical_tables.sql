-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321172842
-- nome:   fix_cascade_to_restrict_critical_tables

-- ============================================================
-- WARNING #2: CASCADE → RESTRICT em tabelas de entidade
-- Impede que DELETE de company destrua customers/suppliers/carriers
-- ============================================================

-- customers: CASCADE → RESTRICT
ALTER TABLE public.customers
  DROP CONSTRAINT customers_company_id_fkey;
ALTER TABLE public.customers
  ADD CONSTRAINT customers_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id)
  ON DELETE RESTRICT;

-- suppliers: CASCADE → RESTRICT
ALTER TABLE public.suppliers
  DROP CONSTRAINT suppliers_company_id_fkey;
ALTER TABLE public.suppliers
  ADD CONSTRAINT suppliers_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id)
  ON DELETE RESTRICT;

-- carriers: CASCADE → RESTRICT
ALTER TABLE public.carriers
  DROP CONSTRAINT carriers_company_id_fkey;
ALTER TABLE public.carriers
  ADD CONSTRAINT carriers_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.companies(id)
  ON DELETE RESTRICT;
