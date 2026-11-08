CREATE OR REPLACE FUNCTION public.upsert_contact_phone(p_contact_id uuid, p_numero character varying, p_phone_type phone_type DEFAULT NULL::phone_type, p_is_primary boolean DEFAULT NULL::boolean, p_is_whatsapp boolean DEFAULT NULL::boolean, p_fonte character varying DEFAULT NULL::character varying, p_observacao text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
