CREATE OR REPLACE FUNCTION public.definir_como_filial(p_filial_id uuid, p_matriz_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
  IF p_filial_id = p_matriz_id THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa não pode ser filial de si mesma');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_filial_id) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa filial não encontrada');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_matriz_id) THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa matriz não encontrada');
  END IF;

  UPDATE companies
  SET matriz_id  = p_matriz_id,
      updated_at = NOW()
  WHERE id = p_filial_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Acesso negado ou empresa não encontrada');
  END IF;

  RETURN jsonb_build_object(
    'status',    'success',
    'message',   'Empresa definida como filial',
    'filial_id', p_filial_id,
    'matriz_id', p_matriz_id
  );
END;
$function$
