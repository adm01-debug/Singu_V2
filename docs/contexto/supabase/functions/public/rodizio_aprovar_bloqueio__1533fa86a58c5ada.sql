CREATE OR REPLACE FUNCTION public.rodizio_aprovar_bloqueio(p_customer_id uuid, p_aprovado_por_id integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  UPDATE public.customer_rotation_state
  SET bloqueio_aprovado_por_id = p_aprovado_por_id, updated_at = now()
  WHERE customer_id = p_customer_id AND bloqueado_ate >= CURRENT_DATE AND bloqueio_aprovado_por_id IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Sem bloqueio pendente de aprovação para este cliente');
  END IF;

  RETURN jsonb_build_object('status', 'success', 'customer_id', p_customer_id);
END;
$function$
