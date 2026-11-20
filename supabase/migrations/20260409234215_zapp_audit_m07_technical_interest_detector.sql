-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409234215
-- nome:   zapp_audit_m07_technical_interest_detector

-- Lead pedindo ficha técnica, laudo, certificação, amostra = alto engajamento
CREATE OR REPLACE FUNCTION zapp_history.detect_technical_interest(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_signals TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('has_technical_interest',false); END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(ficha t[ée]cnica|data ?sheet|especifica[çc][ãao])' THEN v_signals := array_append(v_signals,'ficha_tecnica'); END IF;
  IF v_text_lower ~ '(laudo|certifica[çc][ãa]o|abnt|inmetro|iso \d+|rohs|ce mark)' THEN v_signals := array_append(v_signals,'certificacao'); END IF;
  IF v_text_lower ~ '(gramatura|composi[çc][ãa]o|material|textura|densidade)' THEN v_signals := array_append(v_signals,'material'); END IF;
  IF v_text_lower ~ '(amostra|sample|prova|prot[óo]tipo|mockup|mock-up|mock up)' THEN v_signals := array_append(v_signals,'amostra'); END IF;
  IF v_text_lower ~ '(dimens[õo]es|medidas|tamanho|espessura|\d+\s*(cm|mm|m)\M)' THEN v_signals := array_append(v_signals,'dimensoes'); END IF;

  RETURN jsonb_build_object(
    'has_technical_interest', array_length(v_signals,1) > 0,
    'signals', to_jsonb(v_signals),
    'count', COALESCE(array_length(v_signals,1),0)
  );
END;
$fn$;

-- Adiciona coluna se não existe
ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS technical_interest JSONB;

-- Integra no reconcile (reprocessa ao escrever nlp_processed_at)
CREATE OR REPLACE FUNCTION zapp_history.trg_set_technical_interest()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;
  NEW.technical_interest := zapp_history.detect_technical_interest(NEW.content);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS zzz4_trg_technical_interest ON zapp_history.messages;
CREATE TRIGGER zzz4_trg_technical_interest
  BEFORE UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.trg_set_technical_interest();
