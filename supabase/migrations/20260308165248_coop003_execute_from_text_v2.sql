-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260308165248
-- nome:   coop003_execute_from_text_v2

CREATE OR REPLACE FUNCTION coop003_exec(p_data text) RETURNS jsonb AS $$
DECLARE
  parts text[];
  line text;
  upd int := 0;
  skp int := 0;
BEGIN
  FOREACH line IN ARRAY string_to_array(p_data, E'\n')
  LOOP
    IF line = '' OR line IS NULL THEN CONTINUE; END IF;
    parts := string_to_array(line, '|');
    IF array_length(parts, 1) = 3 THEN
      UPDATE companies SET
        cnpj = parts[2],
        merge_notes = to_jsonb(CONCAT(COALESCE(merge_notes #>> '{}', ''), '|COOP-003-T001:cnpj=' || parts[2] || '|metodo=' || parts[3]))
      WHERE id = parts[1]::uuid AND cnpj IS NULL;
      IF FOUND THEN upd := upd + 1; ELSE skp := skp + 1; END IF;
    END IF;
  END LOOP;
  RETURN jsonb_build_object('updated', upd, 'skipped', skp);
END $$ LANGUAGE plpgsql;
