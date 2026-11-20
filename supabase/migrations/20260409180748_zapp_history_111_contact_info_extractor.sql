-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409180748
-- nome:   zapp_history_111_contact_info_extractor

CREATE OR REPLACE FUNCTION zapp_history.extract_contact_info(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text TEXT;
  v_result JSONB := '{}'::jsonb;
  v_email TEXT;
  v_site TEXT;
  v_insta TEXT;
  v_linkedin TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN v_result; END IF;
  v_text := p_text;

  -- Email
  v_email := (regexp_match(v_text, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'))[1];
  IF v_email IS NOT NULL THEN
    v_result := v_result || jsonb_build_object('email', lower(v_email));
  END IF;

  -- Site/URL
  v_site := (regexp_match(v_text, '(?:https?://)?(?:www\.)?([a-z0-9-]+\.(?:com|com\.br|net|org|io|co)(?:\.[a-z]{2})?(?:/[^\s]*)?)', 'i'))[1];
  IF v_site IS NOT NULL AND v_site NOT LIKE '%@%' THEN
    v_result := v_result || jsonb_build_object('site', lower(v_site));
  END IF;

  -- Instagram @handle
  v_insta := (regexp_match(v_text, '@([a-z0-9._]{3,30})', 'i'))[1];
  IF v_insta IS NOT NULL THEN
    v_result := v_result || jsonb_build_object('instagram', lower(v_insta));
  END IF;

  -- LinkedIn
  v_linkedin := (regexp_match(v_text, 'linkedin\.com/in/([a-z0-9-]+)', 'i'))[1];
  IF v_linkedin IS NOT NULL THEN
    v_result := v_result || jsonb_build_object('linkedin', lower(v_linkedin));
  END IF;

  RETURN v_result;
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS contact_info_extracted JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_contact_info_gin
  ON zapp_history.messages USING GIN (contact_info_extracted)
  WHERE contact_info_extracted IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.extract_contact_info(TEXT) TO authenticated, service_role;
