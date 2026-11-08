CREATE OR REPLACE FUNCTION public.get_data_quality_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', now(),
    'empresas', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
      'com_cnpj', (SELECT COUNT(*) FROM companies WHERE cnpj IS NOT NULL AND cnpj != '' AND deleted_at IS NULL),
      'com_email', (SELECT COUNT(*) FROM companies WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL),
      'com_telefone', (SELECT COUNT(*) FROM companies WHERE telefone IS NOT NULL AND telefone != '' AND deleted_at IS NULL),
      'com_endereco', (SELECT COUNT(*) FROM companies WHERE endereco IS NOT NULL AND endereco != '' AND deleted_at IS NULL),
      'com_uf', (SELECT COUNT(*) FROM companies WHERE uf IS NOT NULL AND uf != '' AND deleted_at IS NULL),
      'score_completude', ROUND(
        (
          (SELECT COUNT(*) FROM companies WHERE cnpj IS NOT NULL AND cnpj != '' AND deleted_at IS NULL) +
          (SELECT COUNT(*) FROM companies WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL) +
          (SELECT COUNT(*) FROM companies WHERE telefone IS NOT NULL AND telefone != '' AND deleted_at IS NULL) +
          (SELECT COUNT(*) FROM companies WHERE endereco IS NOT NULL AND endereco != '' AND deleted_at IS NULL)
        )::numeric / (NULLIF((SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL), 0) * 4) * 100, 2
      )
    ),
    'contatos', jsonb_build_object(
      'total', (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL),
      'com_email', (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL),
      'com_telefone', (SELECT COUNT(*) FROM contacts WHERE telefone IS NOT NULL AND telefone != '' AND deleted_at IS NULL),
      'com_cargo', (SELECT COUNT(*) FROM contacts WHERE cargo IS NOT NULL AND cargo != '' AND deleted_at IS NULL),
      'score_completude', ROUND(
        (
          (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND email != '' AND deleted_at IS NULL) +
          (SELECT COUNT(*) FROM contacts WHERE telefone IS NOT NULL AND telefone != '' AND deleted_at IS NULL) +
          (SELECT COUNT(*) FROM contacts WHERE cargo IS NOT NULL AND cargo != '' AND deleted_at IS NULL)
        )::numeric / (NULLIF((SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL), 0) * 3) * 100, 2
      )
    ),
    'score_geral', ROUND(
      (
        (SELECT COUNT(*) FROM companies WHERE cnpj IS NOT NULL AND email IS NOT NULL AND telefone IS NOT NULL AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL), 0) * 50 +
        (SELECT COUNT(*) FROM contacts WHERE email IS NOT NULL AND telefone IS NOT NULL AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL), 0) * 50
      ), 2
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
