CREATE OR REPLACE FUNCTION public.fn_proximo_sdr(p_customer_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_customer RECORD;
  v_state RECORD;
  v_candidato_id integer;
BEGIN
  SELECT * INTO v_customer FROM public.customers WHERE id = p_customer_id AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.users WHERE participa_rodizio_sdr AND is_active) THEN
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
  JOIN public.sdr_closer_assignments a ON a.sdr_id = u.id
  WHERE u.participa_rodizio_sdr AND u.is_active
    AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
    AND NOT (u.id = ANY(COALESCE(v_state.sdrs_visitados, '{}')))
    AND a.closer_id = v_customer.vendedor_id
    AND a.ativo
  ORDER BY u.ordem_rodizio ASC NULLS LAST
  LIMIT 1;

  IF v_candidato_id IS NULL THEN
    SELECT u.id INTO v_candidato_id
    FROM public.users u
    WHERE u.participa_rodizio_sdr AND u.is_active
      AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
      AND NOT (u.id = ANY(COALESCE(v_state.sdrs_visitados, '{}')))
    ORDER BY u.ordem_rodizio ASC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_candidato_id IS NULL THEN
    UPDATE public.customer_rotation_state
    SET ciclo_sdr = ciclo_sdr + 1, sdrs_visitados = '{}', updated_at = now()
    WHERE customer_id = p_customer_id;

    SELECT u.id INTO v_candidato_id
    FROM public.users u
    WHERE u.participa_rodizio_sdr AND u.is_active
      AND (u.afastado_ate IS NULL OR u.afastado_ate < CURRENT_DATE)
    ORDER BY u.ordem_rodizio ASC NULLS LAST
    LIMIT 1;
  END IF;

  RETURN v_candidato_id;
END;
$function$
