CREATE OR REPLACE FUNCTION public.schedule_visit(p_company_id uuid, p_vendedor_id integer, p_data_agendada timestamp with time zone, p_observacao text DEFAULT NULL::text)
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
    company_id, tipo_interacao, canal, resumo_interacao, 
    usuario_responsavel_id, data_followup, followup_pendente
  )
  VALUES (
    p_company_id, 'visita_agendada', 'presencial', 
    COALESCE(p_observacao, 'Visita agendada'),
    p_vendedor_id, p_data_agendada, true
  )
  RETURNING id INTO new_id;
  
  SELECT jsonb_build_object(
    'success', true,
    'interaction_id', new_id,
    'data_agendada', p_data_agendada,
    'message', 'Visita agendada com sucesso'
  ) INTO result;
  
  RETURN result;
END;
$function$
