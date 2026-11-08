CREATE OR REPLACE FUNCTION public.singu_reverse_sync_company_address()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Se SINGU forneceu city/state inline e empresa não tem endereço, criar
  IF (NEW.city IS NOT NULL OR NEW.state IS NOT NULL) 
     AND NOT EXISTS (SELECT 1 FROM public.company_addresses WHERE company_id = NEW.id) THEN
    INSERT INTO public.company_addresses (company_id, cidade, estado, is_primary, origem, tipo)
    VALUES (NEW.id, NEW.city, NEW.state, true, 'SINGU', 'comercial')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$
