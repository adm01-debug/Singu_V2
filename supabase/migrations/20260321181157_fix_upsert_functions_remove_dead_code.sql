-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321181157
-- nome:   fix_upsert_functions_remove_dead_code

-- ============================================================
-- WARNING #1: Remover dead code das upsert functions
-- A normalização é feita pelo TRIGGER, não pela function
-- ============================================================

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
BEGIN
  -- NOTA: numero_normalizado é calculado automaticamente pelo trigger
  -- trg_company_phones_normalizar (BEFORE INSERT/UPDATE).
  -- Esta function NÃO normaliza — apenas faz o INSERT e deixa o trigger trabalhar.
  -- O ON CONFLICT usa numero_normalizado que o trigger preencheu.

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
BEGIN
  -- NOTA: numero_normalizado é calculado automaticamente pelo trigger
  -- trg_contact_phones_normalizar (BEFORE INSERT/UPDATE).
  -- Esta function NÃO normaliza — apenas faz o INSERT e deixa o trigger trabalhar.

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
