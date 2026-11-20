-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409234337
-- nome:   zapp_audit_m10_budget_extraction_v2

CREATE OR REPLACE FUNCTION zapp_history.extract_budget_from_text(p_text TEXT)
RETURNS NUMERIC
LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_match TEXT;
  v_clean TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- "R$ X milhão/milhões" OR "X milhão"
  v_match := (regexp_match(v_text_lower, '(?:r\$\s*)?(\d+(?:[.,]\d+)?)\s*milh(?:[ãa]o|[õo]es)'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(v_match, ',', '.');
    RETURN (v_clean::NUMERIC) * 1000000;
  END IF;

  -- "R$ X.XM" / "R$ X M" (shortcut milhão)
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d+(?:[.,]\d+)?)\s*m(?:\M|\s)'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(v_match, ',', '.');
    RETURN (v_clean::NUMERIC) * 1000000;
  END IF;

  -- "X mil reais" / "verba de X mil"
  v_match := (regexp_match(v_text_lower, '(?:r\$\s*)?(\d+(?:[.,]\d+)?)\s*mil(?:\s*reais?)?'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(v_match, ',', '.');
    RETURN (v_clean::NUMERIC) * 1000;
  END IF;

  -- "Xk" / "X k" (shortcut mil)
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d+(?:[.,]\d+)?)\s*k(?:\M|\s)'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(v_match, ',', '.');
    RETURN (v_clean::NUMERIC) * 1000;
  END IF;

  -- R$ X.XXX,XX (formato BR completo)
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{2})?)'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(replace(v_match, '.', ''), ',', '.');
    RETURN v_clean::NUMERIC;
  END IF;

  -- R$ XXXX (valor inteiro grande, mínimo 4 dígitos)
  v_match := (regexp_match(v_text_lower, 'r\$\s*(\d{4,9})'))[1];
  IF v_match IS NOT NULL THEN
    RETURN v_match::NUMERIC;
  END IF;

  -- "orçamento/verba de R$ X"
  v_match := (regexp_match(v_text_lower, '(?:or[çc]amento|verba|investimento|budget)[^0-9]{0,30}(?:r\$|de\s*r\$)\s*(\d{1,3}(?:[\.,]\d{3})+(?:,\d{2})?|\d{3,9})'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(replace(v_match, '.', ''), ',', '.');
    RETURN v_clean::NUMERIC;
  END IF;

  -- USD (inglês)
  v_match := (regexp_match(v_text_lower, '\$\s*(\d{1,3}(?:,\d{3})+|\d{4,9})'))[1];
  IF v_match IS NOT NULL THEN
    v_clean := replace(v_match, ',', '');
    RETURN (v_clean::NUMERIC) * 5; -- aprox conversão USD→BRL
  END IF;

  RETURN NULL;
END;
$fn$;
