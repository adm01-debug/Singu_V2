CREATE OR REPLACE FUNCTION public.trg_fn_sync_company_supplier()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Quando is_supplier muda para TRUE: criar registro em suppliers se não existe
  IF NEW.is_supplier = true AND (OLD.is_supplier IS DISTINCT FROM true) THEN
    INSERT INTO suppliers (id, company_id, created_at, updated_at)
    VALUES (gen_random_uuid(), NEW.id, NOW(), NOW())
    ON CONFLICT (company_id) DO NOTHING;
  END IF;

  -- Quando is_supplier muda para FALSE: NÃO deleta (preserva histórico)
  -- Apenas registra que não é mais fornecedor ativo

  RETURN NEW;
END;
$function$
