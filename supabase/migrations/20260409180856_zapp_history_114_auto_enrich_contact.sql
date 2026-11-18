-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409180856
-- nome:   zapp_history_114_auto_enrich_contact

-- Quando NLP detecta email/site/insta/cidade, enriquece o public.contacts automaticamente
CREATE OR REPLACE FUNCTION zapp_history.auto_enrich_contact()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE
  v_email TEXT;
  v_city TEXT;
  v_state TEXT;
  v_existing_email TEXT;
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Email
  v_email := NEW.contact_info_extracted->>'email';
  IF v_email IS NOT NULL THEN
    SELECT email INTO v_existing_email FROM public.contacts WHERE id = NEW.contact_id;
    IF v_existing_email IS NULL OR v_existing_email = '' THEN
      UPDATE public.contacts SET email = v_email, updated_at = NOW() WHERE id = NEW.contact_id;
    END IF;
  END IF;

  -- Cidade/Estado
  v_city := NEW.location_extracted->>'city';
  v_state := NEW.location_extracted->>'state';
  IF v_city IS NOT NULL THEN
    UPDATE public.contacts
    SET city = COALESCE(NULLIF(city, ''), v_city),
        state = COALESCE(NULLIF(state, ''), v_state),
        updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_auto_enrich_contact ON zapp_history.messages;
CREATE TRIGGER trg_auto_enrich_contact
  AFTER UPDATE OF nlp_processed_at ON zapp_history.messages
  FOR EACH ROW
  WHEN (NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL)
  EXECUTE FUNCTION zapp_history.auto_enrich_contact();
