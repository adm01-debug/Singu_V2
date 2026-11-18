-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225008
-- nome:   zapp_history_211_unit_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_unit_of_measure(p_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);
  IF v_text_lower ~ '\m(caixa[s]?|cx|cxs)\M' THEN RETURN 'caixa'; END IF;
  IF v_text_lower ~ '\m(d[úu]zia[s]?|dz|dzs)\M' THEN RETURN 'duzia'; END IF;
  IF v_text_lower ~ '\m(pacote[s]?|pct|pcts|pack)\M' THEN RETURN 'pacote'; END IF;
  IF v_text_lower ~ '\m(kit[s]?|kits de)\M' THEN RETURN 'kit'; END IF;
  IF v_text_lower ~ '\m(kg|kilo[s]?|quilo[s]?)\M' THEN RETURN 'kg'; END IF;
  IF v_text_lower ~ '\m(fardo[s]?)\M' THEN RETURN 'fardo'; END IF;
  IF v_text_lower ~ '\m(milheiro[s]?|milheir[ãa]o)\M' THEN RETURN 'milheiro'; END IF;
  IF v_text_lower ~ '\m(unidade[s]?|und|un|pe[çc]a[s]?)\M' THEN RETURN 'unidade'; END IF;
  RETURN NULL;
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS unit_of_measure TEXT;
CREATE INDEX IF NOT EXISTS idx_messages_unit ON zapp_history.messages(unit_of_measure) WHERE unit_of_measure IS NOT NULL;
GRANT EXECUTE ON FUNCTION zapp_history.detect_unit_of_measure(TEXT) TO authenticated, service_role;
