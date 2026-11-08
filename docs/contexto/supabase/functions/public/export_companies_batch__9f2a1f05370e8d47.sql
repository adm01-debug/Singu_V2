CREATE OR REPLACE FUNCTION public.export_companies_batch(p_company_ids uuid[])
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT 
      c.id,
      c.nome_crm,
      c.cnpj,
      c.email,
      c.telefone,
      c.cidade,
      c.uf,
      c.status,
      (SELECT COUNT(*) FROM contacts ct WHERE ct.company_id = c.id AND ct.deleted_at IS NULL) as total_contatos,
      (SELECT cu.valor_total_compras FROM customers cu WHERE cu.company_id = c.id AND cu.deleted_at IS NULL LIMIT 1) as valor_vendas
    FROM companies c
    WHERE c.id = ANY(p_company_ids)
    AND c.deleted_at IS NULL
  ) t;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$function$
