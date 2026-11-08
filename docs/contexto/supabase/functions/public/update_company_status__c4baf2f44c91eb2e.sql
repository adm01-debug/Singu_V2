CREATE OR REPLACE FUNCTION public.update_company_status(p_company_id uuid, p_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  IF p_status NOT IN ('ativo', 'inativo', 'suspenso') THEN
    RETURN jsonb_build_object('success', false, 'message', 'Status inválido. Use: ativo, inativo, suspenso');
  END IF;

  UPDATE companies
  SET status     = p_status::company_status,
      updated_at = now()
  WHERE id = p_company_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Empresa não encontrada ou acesso negado');
  ELSE
    result := jsonb_build_object('success', true, 'company_id', p_company_id, 'novo_status', p_status);
  END IF;
  RETURN result;
END;
$function$
