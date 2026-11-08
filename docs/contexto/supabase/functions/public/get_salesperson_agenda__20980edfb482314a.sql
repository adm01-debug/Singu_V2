CREATE OR REPLACE FUNCTION public.get_salesperson_agenda(p_vendedor_id integer, p_start_date date DEFAULT CURRENT_DATE, p_end_date date DEFAULT (CURRENT_DATE + '7 days'::interval))
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'vendedor_id', p_vendedor_id,
    'periodo', jsonb_build_object('inicio', p_start_date, 'fim', p_end_date),
    'compromissos', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.data_followup)
      FROM (
        SELECT 
          i.id,
          i.data_followup,
          i.tipo_interacao,
          c.nome_crm,
          c.id as company_id,
          i.resumo_interacao,
          CASE WHEN i.data_followup < now() THEN true ELSE false END as atrasado
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE i.usuario_responsavel_id = p_vendedor_id
        AND i.followup_pendente = true
        AND i.data_followup::date BETWEEN p_start_date AND p_end_date
      ) t
    ),
    'total_compromissos', (
      SELECT COUNT(*) FROM interactions 
      WHERE usuario_responsavel_id = p_vendedor_id 
      AND followup_pendente = true 
      AND data_followup::date BETWEEN p_start_date AND p_end_date
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
