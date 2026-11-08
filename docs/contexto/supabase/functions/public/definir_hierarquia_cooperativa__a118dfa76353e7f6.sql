CREATE OR REPLACE FUNCTION public.definir_hierarquia_cooperativa(p_company_id uuid, p_tipo_cooperativa text, p_central_id uuid DEFAULT NULL::uuid, p_singular_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF p_tipo_cooperativa NOT IN ('CENTRAL', 'SINGULAR', 'PAC') THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Tipo deve ser CENTRAL, SINGULAR ou PAC');
  END IF;

  UPDATE companies SET
    tipo_cooperativa = p_tipo_cooperativa,
    central_id       = p_central_id,
    singular_id      = p_singular_id,
    updated_at       = NOW()
  WHERE id = p_company_id
    AND (auth.uid() IS NULL OR user_id = auth.uid());

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'message', 'Empresa não encontrada ou acesso negado');
  END IF;

  RETURN jsonb_build_object(
    'status',     'success',
    'message',    'Hierarquia de cooperativa definida',
    'company_id', p_company_id,
    'tipo',       p_tipo_cooperativa
  );
END;
$function$
