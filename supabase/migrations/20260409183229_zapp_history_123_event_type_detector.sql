-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409183229
-- nome:   zapp_history_123_event_type_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_event_type(p_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(casamento|noivado|bodas|matrimônio)' THEN RETURN 'casamento'; END IF;
  IF v_text_lower ~ '(formatura|colação)' THEN RETURN 'formatura'; END IF;
  IF v_text_lower ~ '(aniversário|aniversario|festa de aniversário)' THEN RETURN 'aniversario'; END IF;
  IF v_text_lower ~ '(chá de bebê|cha de bebe|chá revelação|chá de cozinha)' THEN RETURN 'cha_celebracao'; END IF;
  IF v_text_lower ~ '(lançamento|lanc[aá]mento|inaugura[çc][ãa]o|abertura|estreia)' THEN RETURN 'lancamento'; END IF;
  IF v_text_lower ~ '(feira|exposi[çc][ãa]o|expo|stand|estande|f[óo]rum|congresso|workshop|convenção|conven[çc][ãa]o)' THEN RETURN 'feira_evento'; END IF;
  IF v_text_lower ~ '(treinamento|capacita[çc][ãa]o|curso|imersão|imers[ãa]o)' THEN RETURN 'treinamento'; END IF;
  IF v_text_lower ~ '(natal|fim de ano|final de ano|confraterniza[çc][ãa]o|natalin[oa])' THEN RETURN 'fim_de_ano'; END IF;
  IF v_text_lower ~ '(p[áa]scoa|dia das m[ãa]es|dia dos pais|dia das crianças|dia do trabalho)' THEN RETURN 'data_comemorativa'; END IF;
  IF v_text_lower ~ '(kit boas vindas|welcome kit|onboarding|integra[çc][ãa]o de novos)' THEN RETURN 'kit_boas_vindas'; END IF;
  IF v_text_lower ~ '(endomarketing|engajamento|incentivo|premia[çc][ãa]o)' THEN RETURN 'endomarketing'; END IF;
  IF v_text_lower ~ '(uniform[ea]|fardamento|colaborador(es)?)' THEN RETURN 'uniforme_corp'; END IF;
  IF v_text_lower ~ '(brinde institucional|brinde corporativo|presente para clientes)' THEN RETURN 'brinde_institucional'; END IF;
  IF v_text_lower ~ '(campanha|a[çc][ãa]o promocional|black friday)' THEN RETURN 'campanha_marketing'; END IF;

  RETURN NULL;
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS event_type TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_event_type ON zapp_history.messages(event_type) WHERE event_type IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_event_type(TEXT) TO authenticated, service_role;
