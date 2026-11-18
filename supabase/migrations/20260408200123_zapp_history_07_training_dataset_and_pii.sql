-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200123
-- nome:   zapp_history_07_training_dataset_and_pii

CREATE TABLE IF NOT EXISTS zapp_history.ai_training_dataset (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  source_type TEXT NOT NULL CHECK (source_type IN (
    'message_pair','audio_transcription','summary','conversation_excerpt'
  )),
  source_id UUID,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES zapp_history.conversations(id) ON DELETE SET NULL,

  input_text TEXT NOT NULL,
  expected_output TEXT,
  context JSONB,

  intent TEXT,
  category TEXT,
  sentiment TEXT,
  entities JSONB,
  tags TEXT[],

  quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
  reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,

  contains_pii BOOLEAN NOT NULL DEFAULT FALSE,
  pii_fields TEXT[],
  pii_redacted_text TEXT,

  used_in_training BOOLEAN NOT NULL DEFAULT FALSE,
  training_run_id TEXT,
  used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atd_source
  ON zapp_history.ai_training_dataset(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_atd_quality
  ON zapp_history.ai_training_dataset(quality_score DESC NULLS LAST, reviewed)
  WHERE reviewed = TRUE;
CREATE INDEX IF NOT EXISTS idx_atd_unreviewed
  ON zapp_history.ai_training_dataset(created_at)
  WHERE reviewed = FALSE;
CREATE INDEX IF NOT EXISTS idx_atd_unused
  ON zapp_history.ai_training_dataset(quality_score DESC)
  WHERE used_in_training = FALSE AND reviewed = TRUE;
CREATE INDEX IF NOT EXISTS idx_atd_pii
  ON zapp_history.ai_training_dataset(contains_pii) WHERE contains_pii = TRUE;

DROP TRIGGER IF EXISTS trg_atd_updated_at ON zapp_history.ai_training_dataset;
CREATE TRIGGER trg_atd_updated_at
  BEFORE UPDATE ON zapp_history.ai_training_dataset
  FOR EACH ROW EXECUTE FUNCTION zapp_history.update_updated_at_column();

-- ----------------------------------------------------------------------------
-- PII detection: CPF, CNPJ, email, telefone BR, cartão de crédito
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION zapp_history.detect_pii(p_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $fn$
DECLARE
  v_fields TEXT[] := ARRAY[]::TEXT[];
  v_redacted TEXT := COALESCE(p_text, '');
BEGIN
  IF p_text IS NULL OR p_text = '' THEN
    RETURN jsonb_build_object('contains_pii', false, 'fields', '[]'::jsonb, 'redacted', '');
  END IF;

  IF p_text ~ '\d{3}\.?\d{3}\.?\d{3}-?\d{2}' THEN
    v_fields := array_append(v_fields, 'cpf');
    v_redacted := regexp_replace(v_redacted, '\d{3}\.?\d{3}\.?\d{3}-?\d{2}', '[CPF]', 'g');
  END IF;

  IF p_text ~ '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}' THEN
    v_fields := array_append(v_fields, 'cnpj');
    v_redacted := regexp_replace(v_redacted, '\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}', '[CNPJ]', 'g');
  END IF;

  IF p_text ~ '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' THEN
    v_fields := array_append(v_fields, 'email');
    v_redacted := regexp_replace(v_redacted, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '[EMAIL]', 'g');
  END IF;

  IF p_text ~ '\(?\d{2}\)?\s?9?\d{4}-?\d{4}' THEN
    v_fields := array_append(v_fields, 'phone');
    v_redacted := regexp_replace(v_redacted, '\(?\d{2}\)?\s?9?\d{4}-?\d{4}', '[PHONE]', 'g');
  END IF;

  IF p_text ~ '\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}' THEN
    v_fields := array_append(v_fields, 'credit_card');
    v_redacted := regexp_replace(v_redacted, '\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}', '[CARD]', 'g');
  END IF;

  RETURN jsonb_build_object(
    'contains_pii', cardinality(v_fields) > 0,
    'fields', to_jsonb(v_fields),
    'redacted', v_redacted
  );
END;
$fn$;
