CREATE OR REPLACE FUNCTION public.calcular_valor_produto()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.valor_total := NEW.quantidade * NEW.preco_unitario * (1 - COALESCE(NEW.desconto_percentual, 0) / 100);
    RETURN NEW;
END;
$function$
