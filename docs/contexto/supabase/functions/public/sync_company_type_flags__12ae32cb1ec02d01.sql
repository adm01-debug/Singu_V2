CREATE OR REPLACE FUNCTION public.sync_company_type_flags()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF TG_TABLE_NAME = 'customers' THEN
        IF TG_OP = 'INSERT' THEN
            UPDATE companies SET is_customer = true WHERE id = NEW.company_id;
        ELSIF TG_OP = 'DELETE' THEN
            -- Verificar se ainda há customers para essa company
            IF NOT EXISTS (SELECT 1 FROM customers WHERE company_id = OLD.company_id AND id != OLD.id) THEN
                UPDATE companies SET is_customer = false WHERE id = OLD.company_id;
            END IF;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$function$
