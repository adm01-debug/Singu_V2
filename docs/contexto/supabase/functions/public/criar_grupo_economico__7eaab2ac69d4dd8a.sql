CREATE OR REPLACE FUNCTION public.criar_grupo_economico(p_nome text, p_tipo text DEFAULT 'OUTROS'::text, p_descricao text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_id UUID;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
    INSERT INTO grupos_economicos (nome, tipo, descricao)
    VALUES (p_nome, p_tipo, p_descricao)
    RETURNING id INTO v_id;
    
    RETURN jsonb_build_object(
        'status', 'success',
        'message', 'Grupo econômico criado',
        'id', v_id,
        'nome', p_nome
    );
END;
$function$
