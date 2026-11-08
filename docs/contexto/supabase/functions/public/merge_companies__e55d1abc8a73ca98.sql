CREATE OR REPLACE FUNCTION public.merge_companies(p_company_keep uuid, p_company_remove uuid)
 RETURNS jsonb
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT result || jsonb_build_object('company_kept', p_company_keep, 'company_removed', p_company_remove,
    'contacts_moved', coalesce((result->'relations_by_table'->>'contacts')::integer, 0),
    'interactions_moved', coalesce((result->'relations_by_table'->>'interactions')::integer, 0))
  FROM (SELECT public.merge_records_atomically('companies', p_company_keep, p_company_remove, '{}'::jsonb) AS result) AS reply
$function$
