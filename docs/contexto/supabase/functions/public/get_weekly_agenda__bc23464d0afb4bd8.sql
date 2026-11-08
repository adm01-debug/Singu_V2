CREATE OR REPLACE FUNCTION public.get_weekly_agenda(p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  week_start date := date_trunc('week', now())::date;
  week_end date := (date_trunc('week', now()) + interval '6 days')::date;
BEGIN
  SELECT jsonb_build_object(
    'semana', jsonb_build_object('inicio', week_start, 'fim', week_end),
    'vendedor_id', p_vendedor_id,
    'por_dia', (
      SELECT jsonb_agg(row_to_json(t) ORDER BY t.dia)
      FROM (
        SELECT 
          i.data_followup::date as dia,
          to_char(i.data_followup, 'Day') as dia_semana,
          COUNT(*) as total_followups,
          jsonb_agg(jsonb_build_object(
            'empresa', c.nome_crm,
            'tipo', i.tipo_interacao,
            'hora', to_char(i.data_followup, 'HH24:MI')
          ) ORDER BY i.data_followup) as followups
        FROM interactions i
        JOIN companies c ON c.id = i.company_id
        WHERE i.followup_pendente = true
        AND i.data_followup::date BETWEEN week_start AND week_end
        AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
        GROUP BY i.data_followup::date, to_char(i.data_followup, 'Day')
      ) t
    ),
    'resumo', jsonb_build_object(
      'total_followups', (
        SELECT COUNT(*) FROM interactions
        WHERE followup_pendente = true
        AND data_followup::date BETWEEN week_start AND week_end
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'atrasados', (
        SELECT COUNT(*) FROM interactions
        WHERE followup_pendente = true
        AND data_followup < now()
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      )
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
