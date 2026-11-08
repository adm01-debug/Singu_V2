CREATE OR REPLACE FUNCTION public.get_company_notes(p_company_id uuid, p_limit integer DEFAULT 20)
 RETURNS TABLE(id uuid, nota text, vendedor_nome text, created_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.resumo_interacao as nota,
    s.nome as vendedor_nome,
    i.created_at
  FROM interactions i
  LEFT JOIN salespeople s ON s.id = i.usuario_responsavel_id
  WHERE i.company_id = p_company_id
  AND i.tipo_interacao = 'nota'
  ORDER BY i.created_at DESC
  LIMIT p_limit;
END;
$function$
