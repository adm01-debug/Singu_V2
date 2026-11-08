CREATE OR REPLACE FUNCTION public.trg_fn_sync_company_carrier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
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
$function$
