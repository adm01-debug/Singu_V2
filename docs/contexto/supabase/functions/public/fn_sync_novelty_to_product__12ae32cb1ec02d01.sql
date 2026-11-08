CREATE OR REPLACE FUNCTION public.fn_sync_novelty_to_product()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.is_active = TRUE AND NEW.is_active = FALSE THEN
            UPDATE products SET is_new = FALSE WHERE id = NEW.product_id;
        END IF;
        IF OLD.is_active = FALSE AND NEW.is_active = TRUE THEN
            UPDATE products SET is_new = TRUE WHERE id = NEW.product_id;
        END IF;
    END IF;
    IF TG_OP = 'DELETE' THEN
        UPDATE products SET is_new = FALSE WHERE id = OLD.product_id;
    END IF;
    IF TG_OP = 'INSERT' THEN
        UPDATE products SET is_new = TRUE WHERE id = NEW.product_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$function$
