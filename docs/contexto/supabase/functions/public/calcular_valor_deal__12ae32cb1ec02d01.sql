CREATE OR REPLACE FUNCTION public.calcular_valor_deal()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    NEW.valor_final := NEW.valor - COALESCE(NEW.desconto_valor, 0) - (NEW.valor * COALESCE(NEW.desconto_percentual, 0) / 100);
    NEW.valor_ponderado := NEW.valor_final * COALESCE(NEW.probabilidade, 0) / 100;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$function$
