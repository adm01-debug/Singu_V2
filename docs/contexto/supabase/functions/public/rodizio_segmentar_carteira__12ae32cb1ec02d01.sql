CREATE OR REPLACE FUNCTION public.rodizio_segmentar_carteira()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count int := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role' USING ERRCODE = 'insufficient_privilege';
  END IF;

  INSERT INTO public.customer_rotation_state (customer_id, segmento, updated_at)
  SELECT c.id, public.fn_segmento_cliente(c.id), now()
  FROM public.customers c
  WHERE c.deleted_at IS NULL
  ON CONFLICT (customer_id) DO UPDATE SET
    segmento = EXCLUDED.segmento, updated_at = now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN jsonb_build_object('status', 'success', 'clientes_processados', v_count);
END;
$function$
