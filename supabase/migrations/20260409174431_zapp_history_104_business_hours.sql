-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409174431
-- nome:   zapp_history_104_business_hours

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS in_business_hours BOOLEAN,
  ADD COLUMN IF NOT EXISTS day_of_week TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_business_hours ON zapp_history.messages(in_business_hours);

CREATE OR REPLACE FUNCTION zapp_history.trg_set_business_hours()
RETURNS TRIGGER LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_local TIMESTAMPTZ;
  v_hour INT;
  v_dow INT;
BEGIN
  v_local := NEW.created_at AT TIME ZONE 'America/Sao_Paulo';
  v_hour := EXTRACT(HOUR FROM v_local);
  v_dow := EXTRACT(DOW FROM v_local); -- 0=domingo, 6=sábado

  -- Horário comercial: seg-sex 8h-18h
  NEW.in_business_hours := (v_dow BETWEEN 1 AND 5) AND (v_hour BETWEEN 8 AND 17);

  NEW.day_of_week := CASE v_dow
    WHEN 0 THEN 'domingo'
    WHEN 1 THEN 'segunda'
    WHEN 2 THEN 'terca'
    WHEN 3 THEN 'quarta'
    WHEN 4 THEN 'quinta'
    WHEN 5 THEN 'sexta'
    WHEN 6 THEN 'sabado'
  END;

  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_set_business_hours ON zapp_history.messages;
CREATE TRIGGER trg_set_business_hours
  BEFORE INSERT ON zapp_history.messages
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_set_business_hours();
