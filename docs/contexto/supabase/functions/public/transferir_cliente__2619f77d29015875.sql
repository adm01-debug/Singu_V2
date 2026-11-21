CREATE OR REPLACE FUNCTION public.transferir_cliente(p_customer_id uuid, p_novo_vendedor_id integer, p_novo_vendedor_nome text, p_executado_por_id integer, p_executado_por_nome text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$ BEGIN RETURN jsonb_build_object('ok', true); END; $function$
