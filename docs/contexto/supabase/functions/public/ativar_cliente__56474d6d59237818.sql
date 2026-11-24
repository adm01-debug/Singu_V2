CREATE OR REPLACE FUNCTION public.ativar_cliente(p_customer_id uuid, p_executado_por_id integer, p_executado_por_nome text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ BEGIN RETURN jsonb_build_object('ok', true); END; $function$
