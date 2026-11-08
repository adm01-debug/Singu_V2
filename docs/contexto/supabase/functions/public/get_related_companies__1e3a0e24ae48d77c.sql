CREATE OR REPLACE FUNCTION public.get_related_companies(p_company_id uuid)
 RETURNS TABLE(id uuid, nome_crm text, cnpj text, razao_social text, tipo_relacao text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  company_razao text;
  company_root_cnpj text;
BEGIN
  -- Pegar razão social e raiz do CNPJ
  SELECT razao_social, LEFT(REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g'), 8)
  INTO company_razao, company_root_cnpj
  FROM companies WHERE id = p_company_id;
  
  RETURN QUERY
  SELECT 
    c.id,
    c.nome_crm,
    c.cnpj,
    c.razao_social,
    CASE 
      WHEN LEFT(REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g'), 8) = company_root_cnpj THEN 'mesmo_grupo_cnpj'
      WHEN c.razao_social = company_razao THEN 'mesma_razao'
      ELSE 'similar'
    END as tipo_relacao
  FROM companies c
  WHERE c.id != p_company_id
  AND c.deleted_at IS NULL
  AND (
    LEFT(REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g'), 8) = company_root_cnpj
    OR c.razao_social = company_razao
  )
  ORDER BY c.nome_crm;
END;
$function$
