-- ============================================================================
-- FIX #5 — Sync automático contact_emails/contact_phones → contacts.email/phone
-- Quando CRM insere email/phone em relação 1:N, copia primário para coluna inline
-- do SINGU em contacts. Mantém dados sincronizados para o SINGU enxergar.
-- ============================================================================

-- 5.1 Trigger para contact_emails: atualizar contacts.email quando primary muda
CREATE OR REPLACE FUNCTION public.singu_sync_contact_email()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_contact_id uuid;
  v_primary_email text;
BEGIN
  -- Pegar contact_id do NEW ou OLD (dependendo da operação)
  v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);

  -- Recomputar o email primário do contact (pode ter mudado)
  SELECT email INTO v_primary_email
  FROM public.contact_emails
  WHERE contact_id = v_contact_id AND email IS NOT NULL
  ORDER BY is_primary DESC, is_verified DESC, created_at DESC
  LIMIT 1;

  -- Atualizar contacts.email (mesmo se ficou NULL, ex: deletou último email)
  UPDATE public.contacts 
  SET email = v_primary_email
  WHERE id = v_contact_id AND COALESCE(email,'') IS DISTINCT FROM COALESCE(v_primary_email,'');

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.singu_sync_contact_email() IS 'SINGU: mantém contacts.email sincronizado com email primário de contact_emails.';

DROP TRIGGER IF EXISTS trg_singu_sync_contact_email ON public.contact_emails;
CREATE TRIGGER trg_singu_sync_contact_email
AFTER INSERT OR UPDATE OR DELETE ON public.contact_emails
FOR EACH ROW
EXECUTE FUNCTION public.singu_sync_contact_email();

-- 5.2 Trigger para contact_phones: atualizar contacts.phone + contacts.whatsapp
CREATE OR REPLACE FUNCTION public.singu_sync_contact_phone()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_contact_id uuid;
  v_primary_phone text;
  v_primary_whatsapp text;
BEGIN
  v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);

  -- Phone primário: qualquer tipo, preferir primary
  SELECT numero INTO v_primary_phone
  FROM public.contact_phones
  WHERE contact_id = v_contact_id AND numero IS NOT NULL
  ORDER BY is_primary DESC, is_verified DESC, created_at DESC
  LIMIT 1;

  -- Whatsapp: só phones com is_whatsapp=true
  SELECT numero INTO v_primary_whatsapp
  FROM public.contact_phones
  WHERE contact_id = v_contact_id AND numero IS NOT NULL AND is_whatsapp = true
  ORDER BY is_primary DESC, created_at DESC
  LIMIT 1;

  UPDATE public.contacts 
  SET 
    phone = v_primary_phone,
    whatsapp = v_primary_whatsapp
  WHERE id = v_contact_id 
    AND (COALESCE(phone,'') IS DISTINCT FROM COALESCE(v_primary_phone,'')
         OR COALESCE(whatsapp,'') IS DISTINCT FROM COALESCE(v_primary_whatsapp,''));

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION public.singu_sync_contact_phone() IS 'SINGU: mantém contacts.phone e contacts.whatsapp sincronizados com primário de contact_phones.';

DROP TRIGGER IF EXISTS trg_singu_sync_contact_phone ON public.contact_phones;
CREATE TRIGGER trg_singu_sync_contact_phone
AFTER INSERT OR UPDATE OR DELETE ON public.contact_phones
FOR EACH ROW
EXECUTE FUNCTION public.singu_sync_contact_phone();
