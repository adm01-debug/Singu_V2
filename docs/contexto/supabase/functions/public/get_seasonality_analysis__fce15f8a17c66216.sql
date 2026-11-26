CREATE OR REPLACE FUNCTION public.get_seasonality_analysis(p_months integer DEFAULT 12)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', now()) - make_interval(months => greatest(1, least(coalesce(p_months, 12), 120)) - 1),
      date_trunc('month', now()), interval '1 month') AS month_start
  ), monthly AS (
    SELECT month_start,
      (SELECT coalesce(sum(valor), 0) FROM deals
        WHERE status = 'ganho' AND closed_at >= month_start AND closed_at < month_start + interval '1 month') AS revenue,
      (SELECT count(*) FROM deals WHERE status = 'ganho'
        AND closed_at >= month_start AND closed_at < month_start + interval '1 month') AS deals,
      (SELECT count(*) FROM interactions WHERE data_interacao >= month_start
        AND data_interacao < month_start + interval '1 month') AS interactions,
      (SELECT count(*) FROM companies WHERE deleted_at IS NULL AND created_at >= month_start
        AND created_at < month_start + interval '1 month') AS companies
    FROM months
  ), seasonal AS (
    SELECT extract(month FROM month_start)::integer AS month,
      to_char(min(month_start), 'Month') AS month_name,
      round(avg(revenue), 2) AS avg_revenue, round(avg(deals), 2) AS avg_deals,
      round(avg(interactions), 2) AS avg_interactions,
      sum(companies) AS companies, sum(interactions) AS interactions
    FROM monthly GROUP BY extract(month FROM month_start)
  )
  SELECT jsonb_build_object(
    'periodo_meses', greatest(1, least(coalesce(p_months, 12), 120)),
    'por_mes', (SELECT coalesce(jsonb_agg(jsonb_build_object('mes_numero', month, 'mes_nome', month_name,
      'empresas_criadas', companies, 'interacoes', interactions) ORDER BY month), '[]'::jsonb) FROM seasonal),
    'melhor_mes_empresas', (SELECT month_name FROM seasonal WHERE companies > 0 ORDER BY companies DESC, month LIMIT 1),
    'series', (SELECT coalesce(jsonb_agg(jsonb_build_object('month', month, 'month_name', month_name,
      'avg_revenue', avg_revenue, 'avg_deals', avg_deals, 'avg_interactions', avg_interactions) ORDER BY month), '[]'::jsonb) FROM seasonal)
  );
$function$
