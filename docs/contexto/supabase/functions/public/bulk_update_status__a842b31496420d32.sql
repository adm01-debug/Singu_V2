CREATE OR REPLACE FUNCTION public.bulk_update_status(p_company_ids uuid[], p_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result   jsonb;
  affected int := 0;
BEGIN
  IF p_status NOT IN ('ativo', 'inativo', 'suspenso') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Status inválido');
  END IF;

  UPDATE companies
  SET status     = p_status::company_status,
      updated_at = now()
  WHERE id = ANY(p_company_ids)
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  RETURN jsonb_build_object(
    'success',             true,
    'novo_status',         p_status,
    'empresas_atualizadas', affected
  );
END;
$function$
