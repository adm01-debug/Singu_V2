CREATE OR REPLACE FUNCTION public.get_dashboard_data()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN json_build_object(
    'companies', get_company_statistics(),
    'contacts', get_contact_statistics(),
    'customers', get_customer_statistics(),
    'pipelines', get_pipeline_statistics(),
    'grupos_economicos', get_economic_group_statistics(),
    'generated_at', NOW()
  );
END;
$function$
