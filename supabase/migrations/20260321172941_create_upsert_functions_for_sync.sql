-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321172941
-- nome:   create_upsert_functions_for_sync

-- ============================================================
-- CORREÇÃO #2: Functions de UPSERT safe para processos de sync
-- N8N/Bitrix podem chamar estas em vez de INSERT direto
-- ============================================================

-- UPSERT company_phone
CREATE OR REPLACE FUNCTION upsert_company_phone(
  p_company_id UUID,
  p_numero VARCHAR,
  p_phone_type phone_type DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT NULL,
  p_is_whatsapp BOOLEAN DEFAULT NULL,
  p_fonte VARCHAR DEFAULT NULL,
  p_contexto VARCHAR DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_numero_norm TEXT;
BEGIN
  -- Normalizar para encontrar conflito
  v_numero_norm := regexp_replace(COALESCE(p_numero, ''), '[^0-9]', '', 'g');
  IF length(v_numero_norm) >= 12 AND left(v_numero_norm, 2) = '55' THEN
    v_numero_norm := substring(v_numero_norm FROM 3);
  END IF;

  -- Tentar insert, se conflito faz update
  INSERT INTO company_phones (company_id, numero, phone_type, is_primary, is_whatsapp, fonte, contexto, observacao)
  VALUES (p_company_id, p_numero, p_phone_type, p_is_primary, p_is_whatsapp, p_fonte, p_contexto, p_observacao)
  ON CONFLICT (company_id, numero_normalizado) DO UPDATE SET
    updated_at = NOW(),
    fonte = COALESCE(EXCLUDED.fonte, company_phones.fonte),
    contexto = COALESCE(EXCLUDED.contexto, company_phones.contexto),
    observacao = COALESCE(EXCLUDED.observacao, company_phones.observacao),
    is_primary = COALESCE(EXCLUDED.is_primary, company_phones.is_primary),
    is_whatsapp = COALESCE(EXCLUDED.is_whatsapp, company_phones.is_whatsapp)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- UPSERT company_email
CREATE OR REPLACE FUNCTION upsert_company_email(
  p_company_id UUID,
  p_email VARCHAR,
  p_email_type email_type DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT NULL,
  p_fonte VARCHAR DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO company_emails (company_id, email, email_type, is_primary, fonte, observacao)
  VALUES (p_company_id, p_email, p_email_type, p_is_primary, p_fonte, p_observacao)
  ON CONFLICT (company_id, LOWER(email)) DO UPDATE SET
    updated_at = NOW(),
    fonte = COALESCE(EXCLUDED.fonte, company_emails.fonte),
    observacao = COALESCE(EXCLUDED.observacao, company_emails.observacao),
    is_primary = COALESCE(EXCLUDED.is_primary, company_emails.is_primary)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- UPSERT contact_phone
CREATE OR REPLACE FUNCTION upsert_contact_phone(
  p_contact_id UUID,
  p_numero VARCHAR,
  p_phone_type phone_type DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT NULL,
  p_is_whatsapp BOOLEAN DEFAULT NULL,
  p_fonte VARCHAR DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_numero_norm TEXT;
BEGIN
  v_numero_norm := regexp_replace(COALESCE(p_numero, ''), '[^0-9]', '', 'g');
  IF length(v_numero_norm) >= 12 AND left(v_numero_norm, 2) = '55' THEN
    v_numero_norm := substring(v_numero_norm FROM 3);
  END IF;

  INSERT INTO contact_phones (contact_id, numero, phone_type, is_primary, is_whatsapp, fonte, observacao)
  VALUES (p_contact_id, p_numero, p_phone_type, p_is_primary, p_is_whatsapp, p_fonte, p_observacao)
  ON CONFLICT (contact_id, numero_normalizado) DO UPDATE SET
    updated_at = NOW(),
    fonte = COALESCE(EXCLUDED.fonte, contact_phones.fonte),
    observacao = COALESCE(EXCLUDED.observacao, contact_phones.observacao),
    is_primary = COALESCE(EXCLUDED.is_primary, contact_phones.is_primary),
    is_whatsapp = COALESCE(EXCLUDED.is_whatsapp, contact_phones.is_whatsapp)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- UPSERT contact_email
CREATE OR REPLACE FUNCTION upsert_contact_email(
  p_contact_id UUID,
  p_email VARCHAR,
  p_email_type email_type DEFAULT NULL,
  p_is_primary BOOLEAN DEFAULT NULL,
  p_fonte VARCHAR DEFAULT NULL,
  p_observacao TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO contact_emails (contact_id, email, email_type, is_primary, fonte, observacao)
  VALUES (p_contact_id, p_email, p_email_type, p_is_primary, p_fonte, p_observacao)
  ON CONFLICT (contact_id, LOWER(email)) DO UPDATE SET
    updated_at = NOW(),
    fonte = COALESCE(EXCLUDED.fonte, contact_emails.fonte),
    observacao = COALESCE(EXCLUDED.observacao, contact_emails.observacao),
    is_primary = COALESCE(EXCLUDED.is_primary, contact_emails.is_primary)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Comentários para documentação
COMMENT ON FUNCTION upsert_company_phone IS 'Safe upsert: insere ou atualiza phone por (company_id, numero_normalizado). Use em vez de INSERT direto.';
COMMENT ON FUNCTION upsert_company_email IS 'Safe upsert: insere ou atualiza email por (company_id, LOWER(email)). Use em vez de INSERT direto.';
COMMENT ON FUNCTION upsert_contact_phone IS 'Safe upsert: insere ou atualiza phone por (contact_id, numero_normalizado). Use em vez de INSERT direto.';
COMMENT ON FUNCTION upsert_contact_email IS 'Safe upsert: insere ou atualiza email por (contact_id, LOWER(email)). Use em vez de INSERT direto.';
