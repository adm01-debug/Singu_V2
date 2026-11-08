CREATE OR REPLACE FUNCTION public.fn_carga_atual_closer(p_vendedor_id integer)
 RETURNS integer
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT count(*)::integer
  FROM public.customers c
  LEFT JOIN public.customer_rotation_state s ON s.customer_id = c.id
  WHERE c.vendedor_id = p_vendedor_id
    AND c.deleted_at IS NULL
    AND COALESCE(s.segmento, 'NAO_ATIVADO') IN ('NAO_ATIVADO', 'INATIVO');
$function$
