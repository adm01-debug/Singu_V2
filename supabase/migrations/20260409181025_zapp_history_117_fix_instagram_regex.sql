-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409181025
-- nome:   zapp_history_117_fix_instagram_regex

CREATE OR REPLACE FUNCTION zapp_history.extract_contact_info(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text TEXT;
  v_clean TEXT;
  v_result JSONB := '{}'::jsonb;
  v_email TEXT;
  v_site TEXT;
  v_insta TEXT;
  v_linkedin TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN v_result; END IF;
  v_text := p_text;

  -- Email primeiro
  v_email := (regexp_match(v_text, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'))[1];
  IF v_email IS NOT NULL THEN
    v_result := v_result || jsonb_build_object('email', lower(v_email));
  END IF;

  -- Remove emails do texto antes de buscar URL/Instagram
  v_clean := regexp_replace(v_text, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', '', 'g');

  -- Site: precisa ter http(s) OU www OU domínio comum em "isolated" word
  v_site := (regexp_match(v_clean, '(?:https?://|www\.)([a-z0-9-]+\.(?:com|com\.br|net|org|io|co)(?:\.[a-z]{2})?(?:/[^\s]*)?)', 'i'))[1];
  IF v_site IS NULL THEN
    -- Sem www/http, exige domínio "limpo"
    v_site := (regexp_match(v_clean, '\m([a-z0-9-]+\.(?:com|com\.br|net|org|io|co)(?:\.[a-z]{2})?)\M', 'i'))[1];
  END IF;
  IF v_site IS NOT NULL THEN
    v_result := v_result || jsonb_build_object('site', lower(rtrim(v_site, '.')));
  END IF;

  -- Remove sites do texto antes de buscar Instagram
  v_clean := regexp_replace(v_clean, '(?:https?://|www\.)?[a-z0-9-]+\.(?:com|com\.br|net|org|io|co)(?:\.[a-z]{2})?(?:/[^\s]*)?', '', 'gi');

  -- Instagram: agora @handle isolado, sem caractere de domínio antes
  v_insta := (regexp_match(v_clean, '(?:^|\s|instagram[:\s]+)@?([a-z0-9._]{3,30})', 'i'))[1];
  -- Mas só aceita se a regex original explicitar @ ou "instagram"
  IF v_clean !~* '(@[a-z0-9._]{3,30}|instagram[:\s]+[a-z0-9._]+)' THEN
    v_insta := NULL;
  END IF;
  IF v_insta IS NOT NULL THEN
    v_insta := (regexp_match(v_clean, '@([a-z0-9._]{3,30})', 'i'))[1];
    IF v_insta IS NOT NULL THEN
      v_result := v_result || jsonb_build_object('instagram', lower(rtrim(v_insta, '.')));
    END IF;
  END IF;

  -- LinkedIn
  v_linkedin := (regexp_match(v_text, 'linkedin\.com/in/([a-z0-9-]+)', 'i'))[1];
  IF v_linkedin IS NOT NULL THEN
    v_result := v_result || jsonb_build_object('linkedin', lower(v_linkedin));
  END IF;

  RETURN v_result;
END;
$fn$;

-- Backfill nas mensagens do teste
UPDATE zapp_history.messages
SET contact_info_extracted = zapp_history.extract_contact_info(content)
WHERE whatsapp_message_id LIKE '\_v116\_%' ESCAPE '\';
