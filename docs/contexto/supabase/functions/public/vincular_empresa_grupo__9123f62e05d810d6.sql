CREATE OR REPLACE FUNCTION public.vincular_empresa_grupo(p_company_id uuid, p_grupo_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE companies SET
    grupo_economico_id = p_grupo_id,
    updated_at         = NOW()
  WHERE id = p_company_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa não encontrada ou acesso negado');
  END IF;

  RETURN jsonb_build_object(
    'status',     'success',
    'message',    'Empresa vinculada ao grupo',
    'company_id', p_company_id,
    'grupo_id',   p_grupo_id
  );
END;
$function$
