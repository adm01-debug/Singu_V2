-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260313154817
-- nome:   add_entidade_sistema_to_tipo_cooperativa

ALTER TABLE companies DROP CONSTRAINT companies_tipo_cooperativa_check;
ALTER TABLE companies ADD CONSTRAINT companies_tipo_cooperativa_check 
  CHECK (tipo_cooperativa = ANY (ARRAY['CENTRAL','SINGULAR','PAC','CONFEDERACAO','ENTIDADE_SISTEMA']));
