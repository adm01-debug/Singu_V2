CREATE OR REPLACE FUNCTION public.get_similar_companies(p_company_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(company_id uuid, name text, ramo text, score integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH ref AS (SELECT ramo_atividade FROM companies WHERE id = p_company_id)
  SELECT c.id, COALESCE(c.nome_fantasia, c.nome_crm), c.ramo_atividade,
    CASE WHEN c.ramo_atividade = (SELECT ramo_atividade FROM ref) THEN 100 ELSE 0 END
  FROM companies c WHERE c.id != p_company_id AND c.deleted_at IS NULL AND c.ramo_atividade IS NOT NULL
  ORDER BY 4 DESC LIMIT p_limit;
$function$
