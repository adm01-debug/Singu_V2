CREATE OR REPLACE FUNCTION public.get_report_metadata()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN jsonb_build_array(
    jsonb_build_object('type', 'sales', 'name', 'Relatório de Vendas', 'params', jsonb_build_array('start_date', 'end_date', 'user_id')),
    jsonb_build_object('type', 'activity', 'name', 'Relatório de Atividades', 'params', jsonb_build_array('start_date', 'end_date', 'user_id')),
    jsonb_build_object('type', 'funnel', 'name', 'Funil de Conversão', 'params', jsonb_build_array('days')),
    jsonb_build_object('type', 'team', 'name', 'Desempenho da Equipe', 'params', jsonb_build_array('period')),
    jsonb_build_object('type', 'churn', 'name', 'Risco de Churn', 'params', jsonb_build_array('inactivity_days'))
  );
END;
$function$
