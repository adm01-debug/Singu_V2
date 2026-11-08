CREATE OR REPLACE FUNCTION public.get_expected_closings(p_days integer DEFAULT 30)
 RETURNS TABLE(deal_id uuid, titulo text, company_name text, valor numeric, previsao date, probabilidade integer)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  SELECT d.id, d.titulo, (SELECT COALESCE(c.nome_fantasia, c.nome_crm) FROM companies c WHERE c.id = d.company_id),
    d.valor, d.previsao_fechamento::date, COALESCE(d.probabilidade, 50)
  FROM deals d WHERE d.status NOT IN ('ganho', 'perdido') AND d.previsao_fechamento <= NOW() + (p_days || ' days')::interval
  ORDER BY d.previsao_fechamento;
$function$
