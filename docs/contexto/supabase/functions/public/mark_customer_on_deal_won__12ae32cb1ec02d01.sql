CREATE OR REPLACE FUNCTION public.mark_customer_on_deal_won()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF NEW.status = 'ganho' AND (OLD IS NULL OR OLD.status != 'ganho') THEN
    UPDATE companies SET is_customer = true WHERE id = NEW.company_id AND is_customer = false;
  END IF;
  RETURN NEW;
END;
$function$
