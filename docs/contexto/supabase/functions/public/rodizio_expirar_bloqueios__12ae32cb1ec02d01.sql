CREATE OR REPLACE FUNCTION public.rodizio_expirar_bloqueios()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_count int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role' USING ERRCODE = 'insufficient_privilege';
  END IF;

  WITH vencidos AS (
    UPDATE public.customer_rotation_state s
    SET bloqueado_ate = NULL, bloqueio_motivo = NULL, bloqueado_por_id = NULL, bloqueio_aprovado_por_id = NULL, updated_at = now()
    WHERE s.bloqueado_ate IS NOT NULL AND s.bloqueado_ate < CURRENT_DATE
    RETURNING s.customer_id
  )
  INSERT INTO public.customer_events (customer_id, evento_tipo, data_evento)
  SELECT customer_id, 'RODIZIO_DESBLOQUEIO', CURRENT_DATE FROM vencidos;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$function$
