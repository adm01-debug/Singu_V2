-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417102942
-- nome:   singu_fix_11_interactions_trigger_refactor

-- ============================================================================
-- FIX #11 — Refatorar trigger de interactions para:
-- 1. Renomear para 'a_singu_normalize_interactions' (prefixo 'a_' garante primeiro)
-- 2. APENAS normalizar type/direction, deixando sync_interaction_fields fazer o resto
-- 3. Evitar duplicação de lógica (CRM já tem bidirecionalidade type↔channel)
-- ============================================================================

-- Dropar o trigger antigo e a função (substituindo)
DROP TRIGGER IF EXISTS trg_singu_interactions_compat ON public.interactions;

CREATE OR REPLACE FUNCTION public.singu_interactions_compat_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Job único: NORMALIZAR type para vocabulário do CHECK constraint
  -- Valores válidos: whatsapp, call, email, meeting, note, social, system, commercial, sdr_alert
  -- O sync_interaction_fields do CRM fará type↔channel depois
  IF NEW.type IS NOT NULL THEN
    NEW.type := CASE 
      WHEN NEW.type = ANY(ARRAY['whatsapp','call','email','meeting','note','social','system','commercial','sdr_alert']) THEN NEW.type
      WHEN NEW.type ILIKE '%whats%' OR NEW.type = 'wa' THEN 'whatsapp'
      WHEN NEW.type ILIKE '%email%' OR NEW.type ILIKE '%e-mail%' OR NEW.type = 'mail' THEN 'email'
      WHEN NEW.type ILIKE '%call%' OR NEW.type ILIKE '%liga%' OR NEW.type ILIKE '%phone%' OR NEW.type ILIKE '%telefone%' THEN 'call'
      WHEN NEW.type ILIKE '%meet%' OR NEW.type ILIKE '%reun%' THEN 'meeting'
      WHEN NEW.type ILIKE '%note%' OR NEW.type ILIKE '%nota%' OR NEW.type ILIKE '%obs%' THEN 'note'
      WHEN NEW.type ILIKE '%social%' OR NEW.type ILIKE '%insta%' OR NEW.type ILIKE '%linkedin%' OR NEW.type ILIKE '%facebook%' THEN 'social'
      WHEN NEW.type ILIKE '%sdr%' OR NEW.type ILIKE '%alert%' THEN 'sdr_alert'
      WHEN NEW.type ILIKE '%commerc%' OR NEW.type ILIKE '%comerc%' THEN 'commercial'
      WHEN NEW.type ILIKE '%system%' OR NEW.type ILIKE '%sistema%' THEN 'system'
      ELSE 'note'
    END;
  END IF;

  -- direction default: se NULL, setar outbound  
  -- (sync_interaction_fields vai popular initiated_by depois)
  IF NEW.direction IS NULL THEN
    NEW.direction := 'outbound';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.singu_interactions_compat_sync() IS 'SINGU: apenas normaliza type para CHECK constraint e seta direction default. Bidirecionalidade type↔channel é feita por sync_interaction_fields do CRM.';

-- Trigger com prefixo 'a_' para rodar PRIMEIRO (ordem alfabética em PostgreSQL)
-- Assim normaliza type ANTES de sync_interaction_fields mapear para channel
CREATE TRIGGER a_singu_normalize_interactions
BEFORE INSERT OR UPDATE OF type, direction
ON public.interactions
FOR EACH ROW
EXECUTE FUNCTION public.singu_interactions_compat_sync();
