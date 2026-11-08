CREATE OR REPLACE FUNCTION public.fn_proximo_closer(p_customer_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_state RECORD;
  v_candidato_id integer;
  v_ciclos_max int;
BEGIN
  SELECT COALESCE(NULLIF(valor,'')::int, 2) INTO v_ciclos_max
    FROM public.config_regras_negocio WHERE chave = 'RODIZIO_CICLOS_ATE_POOL_FRIO';

  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_state FROM public.customer_rotation_state WHERE customer_id = p_customer_id;
  IF NOT FOUND THEN
    INSERT INTO public.customer_rotation_state (customer_id)
    VALUES (p_customer_id)
    RETURNING * INTO v_state;
  END IF;

  SELECT u.id INTO v_candidato_id
  FROM public.users u
  WHERE u.participa_rodizio_closer AND u.is_active
    AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
    AND u.id IS DISTINCT FROM v_customer.vendedor_id
    AND NOT (u.id = ANY(COALESCE(v_state.closers_visitados, '{}')))
    AND (u.capacidade_max IS NULL OR public.fn_carga_atual_closer(u.id) < u.capacidade_max)
  ORDER BY public.fn_carga_atual_closer(u.id) ASC, u.ordem_rodizio ASC NULLS LAST
  LIMIT 1;

  IF v_candidato_id IS NULL THEN
    UPDATE public.customer_rotation_state
    SET ciclo_closer = ciclo_closer + 1, closers_visitados = '{}', updated_at = now()
    WHERE customer_id = p_customer_id
    RETURNING * INTO v_state;

    IF v_state.ciclo_closer > v_ciclos_max THEN
      UPDATE public.customer_rotation_state SET pool_frio = true, updated_at = now()
      WHERE customer_id = p_customer_id;
      RETURN NULL;
    END IF;

    SELECT u.id INTO v_candidato_id
    FROM public.users u
    WHERE u.participa_rodizio_closer AND u.is_active
      AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
      AND u.id IS DISTINCT FROM v_customer.vendedor_id
      AND (u.capacidade_max IS NULL OR public.fn_carga_atual_closer(u.id) < u.capacidade_max)
    ORDER BY public.fn_carga_atual_closer(u.id) ASC, u.ordem_rodizio ASC NULLS LAST
    LIMIT 1;
  END IF;

  RETURN v_candidato_id;
END;
$function$
