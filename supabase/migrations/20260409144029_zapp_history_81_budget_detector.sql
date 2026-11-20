-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409144029
-- nome:   zapp_history_81_budget_detector

CREATE OR REPLACE FUNCTION zapp_history.extract_budget_from_text(p_text TEXT)
RETURNS NUMERIC LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_match TEXT;
  v_clean TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Padrão R$ X.XXX,XX ou R$ X mil
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(replace(v_match, '.', ''), ',', '.');
    RETURN v_clean::NUMERIC;
  END IF;

  -- Padrão "X mil reais" / "X mil"
  v_match := (regexp_match(v_text_lower, '(\d+(?:\.\d+)?)\s*mil\s*reais?'))[1];
  IF v_match IS NOT NULL THEN
    RETURN replace(v_match, '.', '')::NUMERIC * 1000;
  END IF;

  v_match := (regexp_match(v_text_lower, '(?:or[cç]amento|budget|investimento|valor|gasto|verba)\s*(?:de|em|entre|aproximado|aprox|por volta de)?\s*r?\$?\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(replace(v_match, '.', ''), ',', '.');
    RETURN v_clean::NUMERIC;
  END IF;

  RETURN NULL;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.extract_budget_from_text(TEXT) TO authenticated, service_role;
