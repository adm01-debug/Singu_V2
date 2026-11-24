CREATE OR REPLACE FUNCTION public.sdr_qualificar_cliente(p_customer_id uuid, p_sdr_id integer, p_closer_id integer, p_closer_nome text, p_observacoes text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ BEGIN RETURN jsonb_build_object('ok', true); END; $function$
