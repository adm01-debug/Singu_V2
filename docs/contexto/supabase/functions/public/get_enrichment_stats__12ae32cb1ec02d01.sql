CREATE OR REPLACE FUNCTION public.get_enrichment_stats()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_object(
    'total_companies', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL),
    'with_cnpj', (SELECT COUNT(*) FROM companies WHERE deleted_at IS NULL AND cnpj IS NOT NULL AND cnpj != ''),
    'cnpj_cached', (SELECT COUNT(*) FROM cnpj_cache),
    'enriched_today', (SELECT COUNT(*) FROM cnpj_cache WHERE consulted_at::date = CURRENT_DATE),
    'pending_enrichment', (SELECT COUNT(*) FROM companies c WHERE c.deleted_at IS NULL AND c.cnpj IS NOT NULL AND LENGTH(REGEXP_REPLACE(c.cnpj, '[^0-9]', '', 'g')) >= 11 AND (c.razao_social IS NULL OR c.uf IS NULL)),
    'last_enrichment', (SELECT MAX(consulted_at) FROM cnpj_cache)
  );
END;
$function$
