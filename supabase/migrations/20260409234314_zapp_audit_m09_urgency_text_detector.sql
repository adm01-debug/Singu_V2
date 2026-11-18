-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409234314
-- nome:   zapp_audit_m09_urgency_text_detector

-- Complementa delivery_preference com detecção textual de urgência (o NLP remoto às vezes falha)
CREATE OR REPLACE FUNCTION zapp_history.detect_urgency_text(p_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE v_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_lower := lower(p_text);

  IF v_lower ~ '(socorro|urgent[íi]ssimo|pra ontem|prazo apertad|apertado|pra amanh[ãa]|deadline)' THEN RETURN 'imediato'; END IF;
  IF v_lower ~ '(amanh[ãa]|hoje|agora|urgente|r[áa]pido)' THEN RETURN 'proximo_dia'; END IF;
  IF v_lower ~ '(esta semana|nesta semana|at[ée] sexta|at[ée] s[áa]bado|essa semana)' THEN RETURN 'semana'; END IF;
  IF v_lower ~ '(pr[óo]xima semana|semana que vem)' THEN RETURN 'proxima_semana'; END IF;
  IF v_lower ~ '(sem pressa|tranquilo|sem correria|quando der)' THEN RETURN 'sem_pressa'; END IF;

  RETURN NULL;
END;
$fn$;

-- Trigger que complementa delivery_preference quando NULL
CREATE OR REPLACE FUNCTION zapp_history.trg_supplement_urgency()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
DECLARE v_urgency TEXT;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN RETURN NEW; END IF;

  v_urgency := zapp_history.detect_urgency_text(NEW.content);
  IF v_urgency IS NOT NULL THEN
    NEW.delivery_preference := COALESCE(NEW.delivery_preference, '{}'::jsonb) ||
      jsonb_build_object('urgency', v_urgency, 'source', 'text_pattern');
  END IF;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS zzz5_trg_supplement_urgency ON zapp_history.messages;
CREATE TRIGGER zzz5_trg_supplement_urgency
  BEFORE UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.trg_supplement_urgency();
