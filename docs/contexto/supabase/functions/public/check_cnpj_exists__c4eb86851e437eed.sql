CREATE OR REPLACE FUNCTION public.check_cnpj_exists(p_cnpj text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  clean_cnpj text := REGEXP_REPLACE(p_cnpj, '[^0-9]', '', 'g');
BEGIN
  SELECT jsonb_build_object(
    'cnpj_pesquisado', p_cnpj,
    'cnpj_limpo', clean_cnpj,
    'existe', EXISTS (SELECT 1 FROM companies WHERE REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') = clean_cnpj AND deleted_at IS NULL),
    'empresas', (
      SELECT jsonb_agg(row_to_json(t))
      FROM (
        SELECT id, nome_crm, cnpj, status, created_at
        FROM companies
        WHERE REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') = clean_cnpj
        AND deleted_at IS NULL
      ) t
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
