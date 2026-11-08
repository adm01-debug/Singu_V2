CREATE OR REPLACE FUNCTION public.get_pipeline_statistics()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN json_build_object(
    'total_pipelines', (SELECT count(*) FROM pipelines),
    'total_stages', (SELECT count(*) FROM pipeline_stages),
    'total_deals', (SELECT count(*) FROM deals),
    'generated_at', NOW()
  );
END;
$function$
