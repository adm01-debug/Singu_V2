CREATE OR REPLACE FUNCTION public.export_bi_interactions(p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date, p_limit integer DEFAULT 1000)
 RETURNS TABLE(interaction_id uuid, company_id uuid, tipo_interacao text, canal text, vendedor_id uuid, vendedor_nome text, data_interacao timestamp with time zone, followup_pendente boolean)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id as interaction_id,
    i.company_id,
    i.type::text as tipo_interacao,
    i.channel::text as canal,
    i.user_id as vendedor_id,
    pr.full_name::text as vendedor_nome,
    i.data_interacao,
    COALESCE(i.follow_up_required, i.requer_followup, false) as followup_pendente
  FROM interactions i
  LEFT JOIN profiles pr ON pr.id = i.user_id
  WHERE (p_start_date IS NULL OR i.data_interacao::date >= p_start_date)
  AND (p_end_date IS NULL OR i.data_interacao::date <= p_end_date)
  ORDER BY i.data_interacao DESC
  LIMIT p_limit;
END;
$function$
