CREATE OR REPLACE FUNCTION public.get_interaction_history(p_company_id uuid, p_tipo text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, tipo_interacao text, canal text, resumo text, created_at timestamp with time zone, usuario_responsavel_id integer, vendedor_nome text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.type AS tipo_interacao,
    i.channel AS canal,
    i.resumo,
    i.created_at,
    i.usuario_responsavel_id,
    cu.vendedor_nome
  FROM interactions i
  LEFT JOIN customers cu ON cu.company_id = i.company_id AND cu.deleted_at IS NULL
  WHERE i.company_id = p_company_id
  AND (p_tipo IS NULL OR i.type = p_tipo)
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$function$
