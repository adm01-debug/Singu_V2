CREATE OR REPLACE FUNCTION public.register_visit(p_company_id uuid, p_vendedor_id integer, p_resumo text DEFAULT NULL::text, p_data_followup timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  INSERT INTO interactions (company_id, tipo_interacao, canal, resumo_interacao, usuario_responsavel_id, data_followup, followup_pendente)
  VALUES (p_company_id, 'visita', 'presencial', p_resumo, p_vendedor_id, p_data_followup, p_data_followup IS NOT NULL)
  RETURNING id INTO new_id;
  
  SELECT jsonb_build_object(
    'success', true,
    'interaction_id', new_id,
    'tipo', 'visita',
    'message', 'Visita registrada com sucesso'
  ) INTO result;
  
  RETURN result;
END;
$function$
