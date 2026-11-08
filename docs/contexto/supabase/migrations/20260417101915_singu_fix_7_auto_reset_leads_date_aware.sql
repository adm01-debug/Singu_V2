-- ============================================================================
-- FIX #7 — auto_reset_leads_on_update: ajustar para tipo date do destino
-- Origem usa timestamptz, destino usa date. Remover o cast ::date redundante
-- e atribuir CURRENT_DATE explicitamente.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_reset_leads_on_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Se nunca resetou OU resetou antes de hoje → resetar
  IF OLD.leads_today_reset_at IS NULL OR OLD.leads_today_reset_at < CURRENT_DATE THEN
    -- Se NEW.leads_today vinha incrementado, contar como 1 lead hoje
    IF NEW.leads_today > OLD.leads_today THEN
      NEW.leads_today := 1;
    ELSE
      NEW.leads_today := 0;
    END IF;
    NEW.leads_today_reset_at := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.auto_reset_leads_on_update() IS 'SINGU: reset diário do contador leads_today. Ajustado para leads_today_reset_at tipo date (destino CRM).';
