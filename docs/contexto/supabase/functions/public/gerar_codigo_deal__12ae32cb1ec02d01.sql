CREATE OR REPLACE FUNCTION public.gerar_codigo_deal()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    ano TEXT;
    seq INT;
BEGIN
    ano := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(codigo FROM 10) AS INT)), 0) + 1
    INTO seq
    FROM deals
    WHERE codigo LIKE 'DEA-' || ano || '-%';
    
    NEW.codigo := 'DEA-' || ano || '-' || LPAD(seq::TEXT, 5, '0');
    RETURN NEW;
END;
$function$
