-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417004956
-- nome:   singu_fix_5b_contact_reverse_sync

-- ============================================================================
-- FIX #5b — Compat reverso: SINGU envia contacts.email inline → 
-- propagar para contact_emails (para dashboards CRM enxergarem)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.singu_reverse_sync_contact()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- email: se SINGU inseriu/atualizou email inline e não existe em contact_emails, criar
  IF NEW.email IS NOT NULL AND length(trim(NEW.email)) > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.contact_emails 
      WHERE contact_id = NEW.id AND lower(email) = lower(NEW.email)
    ) THEN
      INSERT INTO public.contact_emails (contact_id, email, is_primary, email_type, fonte)
      VALUES (NEW.id, NEW.email, true, 'pessoal'::email_type, 'SINGU')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- phone: idem
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.contact_phones 
      WHERE contact_id = NEW.id AND (numero = NEW.phone OR numero_e164 = NEW.phone)
    ) THEN
      INSERT INTO public.contact_phones (contact_id, numero, is_primary, is_whatsapp, phone_type, fonte)
      VALUES (
        NEW.id, NEW.phone, true, 
        (NEW.whatsapp IS NOT NULL AND NEW.whatsapp = NEW.phone),
        'celular_corporativo'::phone_type, 'SINGU'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  -- whatsapp separado: se é diferente de phone
  IF NEW.whatsapp IS NOT NULL AND length(trim(NEW.whatsapp)) > 0 
     AND NEW.whatsapp IS DISTINCT FROM NEW.phone THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.contact_phones 
      WHERE contact_id = NEW.id AND (numero = NEW.whatsapp OR numero_e164 = NEW.whatsapp)
    ) THEN
      INSERT INTO public.contact_phones (contact_id, numero, is_primary, is_whatsapp, phone_type, fonte)
      VALUES (NEW.id, NEW.whatsapp, false, true, 'celular_corporativo'::phone_type, 'SINGU')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_reverse_sync_contact() IS 'SINGU: quando SINGU insere/atualiza contacts.email/phone/whatsapp inline, propaga para tabelas 1:N contact_emails/contact_phones para CRM enxergar.';

DROP TRIGGER IF EXISTS trg_singu_reverse_sync_contact ON public.contacts;
CREATE TRIGGER trg_singu_reverse_sync_contact
AFTER INSERT OR UPDATE OF email, phone, whatsapp
ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION public.singu_reverse_sync_contact();
