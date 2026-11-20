-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417102133
-- nome:   singu_fix_interactions_type_normalize

-- ============================================================================
-- Melhorar trigger interactions: normalizar 'type' para valor válido do CHECK
-- e mapear channel conforme type normalizado
-- ============================================================================

CREATE OR REPLACE FUNCTION public.singu_interactions_compat_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Normalizar type para valor permitido pelo CHECK constraint
  -- Valores válidos: whatsapp, call, email, meeting, note, social, system, commercial, sdr_alert
  IF NEW.type IS NOT NULL THEN
    NEW.type := CASE 
      WHEN NEW.type ILIKE '%whats%' OR NEW.type = 'wa' THEN 'whatsapp'
      WHEN NEW.type ILIKE '%email%' OR NEW.type ILIKE '%e-mail%' OR NEW.type = 'mail' THEN 'email'
      WHEN NEW.type ILIKE '%call%' OR NEW.type ILIKE '%liga%' OR NEW.type ILIKE '%phone%' OR NEW.type ILIKE '%telefone%' THEN 'call'
      WHEN NEW.type ILIKE '%meet%' OR NEW.type ILIKE '%reun%' THEN 'meeting'
      WHEN NEW.type ILIKE '%note%' OR NEW.type ILIKE '%nota%' OR NEW.type ILIKE '%obs%' THEN 'note'
      WHEN NEW.type ILIKE '%social%' OR NEW.type ILIKE '%insta%' OR NEW.type ILIKE '%linkedin%' OR NEW.type ILIKE '%facebook%' THEN 'social'
      WHEN NEW.type ILIKE '%sdr%' OR NEW.type ILIKE '%alert%' THEN 'sdr_alert'
      WHEN NEW.type ILIKE '%commerc%' OR NEW.type ILIKE '%comerc%' THEN 'commercial'
      WHEN NEW.type ILIKE '%system%' OR NEW.type ILIKE '%sistema%' THEN 'system'
      WHEN NEW.type = ANY(ARRAY['whatsapp','call','email','meeting','note','social','system','commercial','sdr_alert']) THEN NEW.type
      ELSE 'note'  -- fallback seguro
    END;
  END IF;

  -- Mapear channel com base no type normalizado
  IF NEW.channel IS NULL THEN
    NEW.channel := CASE NEW.type
      WHEN 'whatsapp' THEN 'whatsapp'
      WHEN 'email' THEN 'email'
      WHEN 'call' THEN 'telefone'
      WHEN 'meeting' THEN 'reuniao_online'
      WHEN 'note' THEN 'bitrix_chat'
      WHEN 'social' THEN 'chat_site'
      WHEN 'sdr_alert' THEN 'bitrix_chat'
      WHEN 'commercial' THEN 'bitrix_chat'
      WHEN 'system' THEN 'bitrix_chat'
      ELSE 'bitrix_chat'
    END;
  END IF;

  -- direction default
  IF NEW.direction IS NULL THEN
    NEW.direction := 'outbound';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_interactions_compat_sync() IS 'SINGU: normaliza type para valor válido do CHECK, mapeia type→channel, seta direction=outbound. Aceita variações pt/en do SINGU.';
