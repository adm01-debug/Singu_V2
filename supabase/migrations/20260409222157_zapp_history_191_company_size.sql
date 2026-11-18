-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409222157
-- nome:   zapp_history_191_company_size

CREATE OR REPLACE FUNCTION zapp_history.detect_company_size(p_text TEXT, p_qty INT, p_budget NUMERIC)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_size TEXT;
  v_score INT := 0;
  v_signals TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('size','indefinido'); END IF;
  v_text_lower := lower(p_text);

  -- Sinais de empresa GRANDE (corp/enterprise)
  IF v_text_lower ~ '(multinacional|corpora[çc][ãa]o|holding|grupo empresarial|matriz|filia(l|is)|nacional|in[úu]meras unidades)' THEN
    v_score := v_score + 30; v_signals := array_append(v_signals,'multinacional_holding');
  END IF;
  IF v_text_lower ~ '(departamento|setor|diretoria|gerência|coordena[çc][ãa]o|equipe de \d+|time de \d+)' THEN
    v_score := v_score + 10; v_signals := array_append(v_signals,'estrutura_corporativa');
  END IF;
  IF v_text_lower ~ '(processo licitat[óo]rio|pregão|concorrência|cotação fechada|RFP|RFQ|tomada de pre[çc]o)' THEN
    v_score := v_score + 25; v_signals := array_append(v_signals,'processo_formal');
  END IF;

  -- Sinais de PME
  IF v_text_lower ~ '(pequena empresa|empresa familiar|estamos come[çc]ando|s[óo]cio[s]?|pme|microempresa|mei)' THEN
    v_score := v_score - 15; v_signals := array_append(v_signals,'pme_familiar');
  END IF;

  -- Pelo volume
  IF p_qty IS NOT NULL THEN
    IF p_qty >= 10000 THEN v_score := v_score + 25; v_signals := array_append(v_signals,'volume_enterprise');
    ELSIF p_qty >= 2000 THEN v_score := v_score + 15; v_signals := array_append(v_signals,'volume_grande');
    ELSIF p_qty >= 500 THEN v_score := v_score + 5; v_signals := array_append(v_signals,'volume_medio');
    ELSIF p_qty < 100 THEN v_score := v_score - 10; v_signals := array_append(v_signals,'volume_pequeno');
    END IF;
  END IF;

  -- Pelo budget
  IF p_budget IS NOT NULL THEN
    IF p_budget >= 100000 THEN v_score := v_score + 25; v_signals := array_append(v_signals,'budget_enterprise');
    ELSIF p_budget >= 20000 THEN v_score := v_score + 10; v_signals := array_append(v_signals,'budget_grande');
    END IF;
  END IF;

  v_size := CASE
    WHEN v_score >= 30 THEN 'enterprise'
    WHEN v_score >= 10 THEN 'grande'
    WHEN v_score >= 0 THEN 'media'
    ELSE 'pequena'
  END;

  RETURN jsonb_build_object('size', v_size, 'score', v_score, 'signals', to_jsonb(v_signals));
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS company_size JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_company_size ON zapp_history.messages((company_size->>'size')) WHERE company_size IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_company_size(TEXT, INT, NUMERIC) TO authenticated, service_role;
