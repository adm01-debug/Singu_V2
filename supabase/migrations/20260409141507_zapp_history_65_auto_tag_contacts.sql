-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409141507
-- nome:   zapp_history_65_auto_tag_contacts

-- Quando NLP detecta produto, adiciona tag no contato pra segmentação automática
CREATE OR REPLACE FUNCTION zapp_history.auto_tag_contact_from_nlp()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  v_product TEXT;
  v_new_tags TEXT[];
  v_current_tags TEXT[];
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.nlp_structured_order IS NULL THEN
    RETURN NEW;
  END IF;

  v_product := NEW.nlp_structured_order->>'product';
  IF v_product IS NULL OR v_product = '' THEN
    RETURN NEW;
  END IF;

  -- Tags a adicionar
  v_new_tags := ARRAY[
    'wpp:produto:' || lower(v_product),
    'wpp:lead:' || COALESCE(NEW.nlp_sentiment, 'neutral'),
    'wpp:auto'
  ];

  -- Lê tags atuais do contato
  SELECT tags_array INTO v_current_tags
  FROM public.contacts WHERE id = NEW.contact_id;

  -- Faz union e atualiza
  UPDATE public.contacts
  SET tags_array = (
    SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(v_current_tags, ARRAY[]::TEXT[]) || v_new_tags))
  ),
  updated_at = NOW()
  WHERE id = NEW.contact_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_auto_tag_contact ON zapp_history.messages;
CREATE TRIGGER trg_auto_tag_contact
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.auto_tag_contact_from_nlp();
