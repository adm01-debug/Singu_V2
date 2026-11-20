-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330120931
-- nome:   create_carrier_company_sync_trigger

-- Function: sync company → carrier
CREATE OR REPLACE FUNCTION trg_fn_sync_company_carrier()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Quando is_carrier muda para TRUE: criar registro em carriers se não existe
  IF NEW.is_carrier = true AND (OLD.is_carrier IS DISTINCT FROM true) THEN
    INSERT INTO carriers (id, company_id, created_at, updated_at)
    VALUES (gen_random_uuid(), NEW.id, NOW(), NOW())
    ON CONFLICT (company_id) DO NOTHING;
  END IF;

  -- Quando is_carrier muda para FALSE: NÃO deleta (preserva histórico)
  RETURN NEW;
END;
$function$;

-- Trigger UPDATE: quando is_carrier muda
CREATE TRIGGER trg_company_sync_carrier
  AFTER UPDATE OF is_carrier ON companies
  FOR EACH ROW
  WHEN (OLD.is_carrier IS DISTINCT FROM NEW.is_carrier)
  EXECUTE FUNCTION trg_fn_sync_company_carrier();

-- Trigger INSERT: quando company já nasce como carrier
CREATE TRIGGER trg_company_insert_sync_carrier
  AFTER INSERT ON companies
  FOR EACH ROW
  WHEN (NEW.is_carrier = true)
  EXECUTE FUNCTION trg_fn_sync_company_carrier();

COMMENT ON FUNCTION trg_fn_sync_company_carrier() IS 'Auto-cria registro em carriers quando company.is_carrier muda para true';
