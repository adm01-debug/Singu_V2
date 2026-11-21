CREATE OR REPLACE FUNCTION public.registrar_compra(p_customer_id uuid, p_valor numeric, p_numero_pedido text, p_observacoes text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$ BEGIN RETURN jsonb_build_object('ok', true); END; $function$
