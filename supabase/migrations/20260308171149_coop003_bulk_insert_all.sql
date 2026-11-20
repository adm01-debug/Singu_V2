-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260308171149
-- nome:   coop003_bulk_insert_all

-- Bulk insert all matches + execute update in one transaction
TRUNCATE coop003_pending;

-- Use the existing coop003_exec function to process all remaining
-- First, let's do the UPDATE directly from existing matched data
-- by using a DO block that calls coop003_exec internally

DO $$
DECLARE
  v_result jsonb;
  v_total_updated int := 0;
  v_total_skipped int := 0;
  v_batch_result jsonb;
  v_pac record;
  v_upd int;
  v_skp int;
BEGIN
  -- Process all PACs that still need CNPJ
  FOR v_pac IN 
    SELECT c.id, c.cnpj_base, c.merge_notes #>> '{}' AS mn_text
    FROM companies c
    WHERE c.tipo_cooperativa = 'PAC'
      AND c.status = 'ativo'
      AND c.cnpj IS NULL
      AND c.cnpj_base IS NOT NULL
      AND c.grupo_economico_id = '45c6c11e-d898-4d98-a997-d427619d867d'
      AND c.merge_notes IS NOT NULL
      AND c.merge_notes::text LIKE '%CEP:%'
  LOOP
    -- This approach won't work because we need the BigQuery data
    -- Let's use a different strategy
    NULL;
  END LOOP;
END $$;
