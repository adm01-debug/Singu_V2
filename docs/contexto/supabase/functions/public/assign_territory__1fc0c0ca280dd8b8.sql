CREATE OR REPLACE FUNCTION public.assign_territory(p_user_id uuid, p_ufs text[])
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_updated INT := 0;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  -- Só gestor de território ativo que cubra as UFs pedidas pode assumir empresas
  IF auth.uid() IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM territories t
    WHERE t.manager_id = p_user_id AND t.is_active AND p_ufs <@ t.states
  ) THEN
    RAISE EXCEPTION 'Unauthorized: user % does not manage a territory covering the requested UFs', p_user_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Atualiza empresas no território para o vendedor
  UPDATE companies
  SET user_id = p_user_id,
      updated_at = NOW()
  WHERE id IN (
    SELECT c.id
    FROM companies c
    JOIN company_addresses ca ON ca.company_id = c.id
    WHERE ca.tipo = 'principal'
      AND ca.estado = ANY(p_ufs)
      AND c.user_id IS NULL
      AND c.deleted_at IS NULL
  );

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$function$
