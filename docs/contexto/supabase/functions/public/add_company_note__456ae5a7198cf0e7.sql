CREATE OR REPLACE FUNCTION public.add_company_note(p_company_id uuid, p_nota text, p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO interactions (
    company_id, tipo_interacao, resumo_interacao, 
    usuario_responsavel_id, followup_pendente
  )
  VALUES (
    p_company_id, 'nota', p_nota, p_vendedor_id, false
  )
  RETURNING id INTO new_id;
  
  SELECT jsonb_build_object(
    'success', true,
    'interaction_id', new_id,
    'message', 'Nota adicionada'
  ) INTO result;
  
  RETURN result;
END;
$function$
