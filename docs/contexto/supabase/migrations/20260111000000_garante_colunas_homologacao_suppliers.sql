-- Corrige o Supabase Preview da PR #267.
--
-- A migration 20260329175449 (recuperada da producao) adiciona homologado /
-- data_homologacao / score_geral a suppliers, mas ficou registrada-sem-aplicar
-- no preview. Como o CLI rastreia por version, editar a 0002 (ja registrada)
-- nao reexecuta nada; a view 20260329181336 (vw_suppliers) falha com
-- 'column s.homologado does not exist'.
--
-- Esta migration tem version ANTERIOR a cadeia de 29/mar, entao o preview a
-- aplica ANTES da view, garantindo a base para vw_suppliers e
-- vw_suppliers_completo. Se a 20260329175449 rodar depois, o
-- ADD COLUMN IF NOT EXISTS e no-op (colunas ja existem). Idempotente tambem
-- no replay completo local.
ALTER TABLE public.suppliers
  ADD COLUMN IF NOT EXISTS homologado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_homologacao DATE,
  ADD COLUMN IF NOT EXISTS score_geral NUMERIC(5,2)
