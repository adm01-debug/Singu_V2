-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417101915
-- nome:   singu_fix_7_auto_reset_leads_date_aware

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
