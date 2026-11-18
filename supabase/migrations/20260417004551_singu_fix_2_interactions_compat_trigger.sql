-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417004551
-- nome:   singu_fix_2_interactions_compat_trigger

-- ============================================================================
-- FIX #2 — interactions.channel e interactions.direction NOT NULL
-- SINGU envia {type, title, contact_id} sem channel/direction
-- Mapear: type='whatsapp' → channel='whatsapp', default direction='outbound'
-- ============================================================================

CREATE OR REPLACE FUNCTION public.singu_interactions_compat_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Mapear type → channel se channel for NULL
  IF NEW.channel IS NULL THEN
    NEW.channel := CASE 
      WHEN NEW.type ILIKE '%whatsapp%' OR NEW.type ILIKE '%wa%' THEN 'whatsapp'
      WHEN NEW.type ILIKE '%email%' OR NEW.type ILIKE '%e-mail%' THEN 'email'
      WHEN NEW.type ILIKE '%phone%' OR NEW.type ILIKE '%call%' OR NEW.type ILIKE '%ligaç%' THEN 'telefone'
      WHEN NEW.type ILIKE '%sms%' THEN 'sms'
      WHEN NEW.type ILIKE '%meeting%' OR NEW.type ILIKE '%reun%' THEN 'reuniao_online'
      WHEN NEW.type ILIKE '%presencial%' OR NEW.type ILIKE '%visita%' THEN 'reuniao_presencial'
      WHEN NEW.type ILIKE '%chat%' THEN 'chat_site'
      ELSE 'bitrix_chat'  -- fallback seguro
    END;
  END IF;

  -- direction default: se for NULL, usar 'outbound' (mais comum em CRM)
  IF NEW.direction IS NULL THEN
    NEW.direction := 'outbound';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_interactions_compat_sync() IS 'SINGU: mapeia type → channel e garante direction preenchido. Previne NOT NULL violation no INSERT do SINGU.';

DROP TRIGGER IF EXISTS trg_singu_interactions_compat ON public.interactions;
CREATE TRIGGER trg_singu_interactions_compat
BEFORE INSERT OR UPDATE OF type, channel, direction
ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.singu_interactions_compat_sync();
