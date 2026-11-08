CREATE OR REPLACE FUNCTION public.get_pending_followups(p_vendedor_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 50)
 RETURNS TABLE(interaction_id uuid, company_id uuid, nome_crm text, tipo_interacao text, data_followup timestamp with time zone, dias_restantes integer, atrasado boolean, vendedor_nome text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    i.id as interaction_id,
    i.company_id,
    c.nome_crm,
    i.type AS tipo_interacao,
    COALESCE(i.data_followup, i.follow_up_date::timestamptz) as data_followup,
    EXTRACT(DAY FROM COALESCE(i.data_followup, i.follow_up_date::timestamptz) - now())::int as dias_restantes,
    COALESCE(i.data_followup, i.follow_up_date::timestamptz) < now() as atrasado,
    cu.vendedor_nome
  FROM interactions i
  JOIN companies c ON c.id = i.company_id
  LEFT JOIN customers cu ON cu.company_id = i.company_id AND cu.deleted_at IS NULL
  WHERE (COALESCE(i.requer_followup, false) AND NOT COALESCE(i.followup_concluido, false)
         OR COALESCE(i.follow_up_required, false))
  AND COALESCE(i.data_followup, i.follow_up_date::timestamptz) IS NOT NULL
  AND (p_vendedor_id IS NULL OR i.usuario_responsavel_id = p_vendedor_id)
  ORDER BY data_followup ASC
  LIMIT p_limit;
END;
$function$
