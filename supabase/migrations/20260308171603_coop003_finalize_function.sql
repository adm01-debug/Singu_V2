-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260308171603
-- nome:   coop003_finalize_function

CREATE OR REPLACE FUNCTION coop003_finalize() RETURNS jsonb AS $$
DECLARE
  upd int;
BEGIN
  UPDATE companies c SET
    cnpj = p.cnpj,
    merge_notes = to_jsonb(
      CONCAT(COALESCE(c.merge_notes #>> '{}', ''), 
             '|COOP-003-T001:cnpj=' || p.cnpj || '|metodo=' || p.metodo)
    )
  FROM coop003_pending p
  WHERE c.id = p.id AND c.cnpj IS NULL;
  
  GET DIAGNOSTICS upd = ROW_COUNT;
  RETURN jsonb_build_object('updated', upd);
END $$ LANGUAGE plpgsql;
