CREATE OR REPLACE FUNCTION public.get_field_quality_analysis()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  total_empresas int;
BEGIN
  SELECT COUNT(*) INTO total_empresas FROM companies WHERE deleted_at IS NULL;
  
  SELECT jsonb_build_object(
    'total_empresas', total_empresas,
    'preenchimento', jsonb_build_object(
      'cnpj', jsonb_build_object(
        'preenchido', (SELECT COUNT(*) FROM companies WHERE cnpj IS NOT NULL AND cnpj != '' AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM companies WHERE cnpj IS NOT NULL AND cnpj != '' AND deleted_at IS NULL)::numeric / total_empresas * 100, 2)
      ),
      'email', jsonb_build_object(
        'preenchido', (SELECT COUNT(*) FROM companies WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM companies WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL)::numeric / total_empresas * 100, 2)
      ),
      'telefone', jsonb_build_object(
        'preenchido', (SELECT COUNT(*) FROM companies WHERE telefone IS NOT NULL AND telefone != '' AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM companies WHERE telefone IS NOT NULL AND telefone != '' AND deleted_at IS NULL)::numeric / total_empresas * 100, 2)
      ),
      'cidade', jsonb_build_object(
        'preenchido', (SELECT COUNT(*) FROM companies WHERE cidade IS NOT NULL AND cidade != '' AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM companies WHERE cidade IS NOT NULL AND cidade != '' AND deleted_at IS NULL)::numeric / total_empresas * 100, 2)
      ),
      'uf', jsonb_build_object(
        'preenchido', (SELECT COUNT(*) FROM companies WHERE uf IS NOT NULL AND uf != '' AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM companies WHERE uf IS NOT NULL AND uf != '' AND deleted_at IS NULL)::numeric / total_empresas * 100, 2)
      ),
      'cep', jsonb_build_object(
        'preenchido', (SELECT COUNT(*) FROM companies WHERE cep IS NOT NULL AND cep != '' AND deleted_at IS NULL),
        'percentual', ROUND((SELECT COUNT(*) FROM companies WHERE cep IS NOT NULL AND cep != '' AND deleted_at IS NULL)::numeric / total_empresas * 100, 2)
      )
    ),
    'score_medio', ROUND((
      (SELECT COUNT(*) FROM companies WHERE cnpj IS NOT NULL AND cnpj != '' AND deleted_at IS NULL) +
      (SELECT COUNT(*) FROM companies WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL) +
      (SELECT COUNT(*) FROM companies WHERE telefone IS NOT NULL AND telefone != '' AND deleted_at IS NULL) +
      (SELECT COUNT(*) FROM companies WHERE cidade IS NOT NULL AND cidade != '' AND deleted_at IS NULL) +
      (SELECT COUNT(*) FROM companies WHERE uf IS NOT NULL AND uf != '' AND deleted_at IS NULL) +
      (SELECT COUNT(*) FROM companies WHERE cep IS NOT NULL AND cep != '' AND deleted_at IS NULL)
    )::numeric / (total_empresas * 6) * 100, 2)
  ) INTO result;
  
  RETURN result;
END;
$function$
