CREATE OR REPLACE FUNCTION public.find_potential_duplicates(p_similarity_threshold numeric DEFAULT 0.7, p_limit integer DEFAULT 50)
 RETURNS TABLE(company1_id uuid, company1_name text, company2_id uuid, company2_name text, similarity numeric)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c1.id as company1_id,
    COALESCE(c1.nome_fantasia, c1.nome_crm, c1.razao_social) as company1_name,
    c2.id as company2_id,
    COALESCE(c2.nome_fantasia, c2.nome_crm, c2.razao_social) as company2_name,
    similarity(LOWER(COALESCE(c1.nome_fantasia, c1.nome_crm, c1.razao_social)), 
               LOWER(COALESCE(c2.nome_fantasia, c2.nome_crm, c2.razao_social))) as similarity
  FROM companies c1
  JOIN companies c2 ON c1.id < c2.id
  WHERE c1.status = 'ativo' AND c2.status = 'ativo'
    AND similarity(LOWER(COALESCE(c1.nome_fantasia, c1.nome_crm, c1.razao_social)), 
                   LOWER(COALESCE(c2.nome_fantasia, c2.nome_crm, c2.razao_social))) >= p_similarity_threshold
  ORDER BY similarity DESC
  LIMIT p_limit;
END;
$function$
