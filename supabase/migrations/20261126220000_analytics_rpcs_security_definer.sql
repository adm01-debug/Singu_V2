-- RPCs de analise agregada passam a rodar como SECURITY DEFINER.
--
-- Causa: as funcoes de dashboard/analytics sao SECURITY INVOKER, entao herdam a
-- RLS das tabelas base. companies, contacts, deals e interactions usam policy por
-- dono (auth.uid() = user_id) e 53.868 das 57.475 empresas estao sem user_id,
-- enquanto as demais pertencem a 9 usuarios. Medido via PostgREST com um usuario
-- real (perfil salesperson, que tem a permissao view_analytics): zero linhas em
-- companies/contacts/deals/alerts, e todos os RPCs de analise devolvendo zero ou
-- vazio. Para um admin, o mesmo get_sales_funnel devolve novo = 56.979.
--
-- Escopo: apenas funcoes de leitura agregada (contagem, soma, taxa, ranking,
-- segmento). Nenhuma devolve dado pessoal de cliente - conferido funcao por funcao
-- em pg_get_function_result. As funcoes parametrizadas por p_user_id /
-- p_vendedor_id / p_territory_id ficam INVOKER de proposito: sob DEFINER elas
-- permitiriam ler a carteira de outro vendedor passando um uuid arbitrario, o que
-- seria escalacao de leitura.
--
-- search_path fixado em toda funcao DEFINER para nao permitir sequestro de schema.
-- Os grants nao mudam: postgres, authenticated e service_role (nenhuma destas
-- funcoes expoe EXECUTE para anon ou PUBLIC).
-- analyze_loss_patterns
alter function public.analyze_loss_patterns() security definer;
alter function public.analyze_loss_patterns() set search_path to 'public', 'pg_temp';

-- compare_periods
alter function public.compare_periods(text, integer) security definer;
alter function public.compare_periods(text, integer) set search_path to 'public', 'pg_temp';
alter function public.compare_periods(date, date, date, date) security definer;
alter function public.compare_periods(date, date, date, date) set search_path to 'public', 'pg_temp';

-- compare_seller_efficiency
alter function public.compare_seller_efficiency() security definer;
alter function public.compare_seller_efficiency() set search_path to 'public', 'pg_temp';

-- get_best_industries
alter function public.get_best_industries() security definer;
alter function public.get_best_industries() set search_path to 'public', 'pg_temp';

-- get_channel_analysis
alter function public.get_channel_analysis(integer) security definer;
alter function public.get_channel_analysis(integer) set search_path to 'public', 'pg_temp';

-- get_channel_conversion
alter function public.get_channel_conversion() security definer;
alter function public.get_channel_conversion() set search_path to 'public', 'pg_temp';

-- get_churn_risk_report
alter function public.get_churn_risk_report() security definer;
alter function public.get_churn_risk_report() set search_path to 'public', 'pg_temp';

-- get_cohort_analysis
alter function public.get_cohort_analysis(integer) security definer;
alter function public.get_cohort_analysis(integer) set search_path to 'public', 'pg_temp';
alter function public.get_cohort_analysis(text) security definer;
alter function public.get_cohort_analysis(text) set search_path to 'public', 'pg_temp';

-- get_conversion_funnel
alter function public.get_conversion_funnel(integer) security definer;
alter function public.get_conversion_funnel(integer) set search_path to 'public', 'pg_temp';

-- get_data_quality_report
alter function public.get_data_quality_report() security definer;
alter function public.get_data_quality_report() set search_path to 'public', 'pg_temp';

-- get_executive_dashboard
alter function public.get_executive_dashboard() security definer;
alter function public.get_executive_dashboard() set search_path to 'public', 'pg_temp';

-- get_industry_analysis
alter function public.get_industry_analysis() security definer;
alter function public.get_industry_analysis() set search_path to 'public', 'pg_temp';

-- get_industry_roi
alter function public.get_industry_roi() security definer;
alter function public.get_industry_roi() set search_path to 'public', 'pg_temp';

-- get_leaderboard
alter function public.get_leaderboard(text) security definer;
alter function public.get_leaderboard(text) set search_path to 'public', 'pg_temp';

-- get_loss_reason_analysis
alter function public.get_loss_reason_analysis(integer) security definer;
alter function public.get_loss_reason_analysis(integer) set search_path to 'public', 'pg_temp';

-- get_ltv_segments
alter function public.get_ltv_segments() security definer;
alter function public.get_ltv_segments() set search_path to 'public', 'pg_temp';

-- get_pareto_summary
alter function public.get_pareto_summary() security definer;
alter function public.get_pareto_summary() set search_path to 'public', 'pg_temp';

-- get_retention_by_cohort
alter function public.get_retention_by_cohort() security definer;
alter function public.get_retention_by_cohort() set search_path to 'public', 'pg_temp';

-- get_rfm_dashboard
alter function public.get_rfm_dashboard() security definer;
alter function public.get_rfm_dashboard() set search_path to 'public', 'pg_temp';

-- get_rfm_segments
alter function public.get_rfm_segments() security definer;
alter function public.get_rfm_segments() set search_path to 'public', 'pg_temp';

-- get_sales_cycle_analysis
alter function public.get_sales_cycle_analysis() security definer;
alter function public.get_sales_cycle_analysis() set search_path to 'public', 'pg_temp';

-- get_sales_funnel
alter function public.get_sales_funnel() security definer;
alter function public.get_sales_funnel() set search_path to 'public', 'pg_temp';

-- get_seasonality_analysis
alter function public.get_seasonality_analysis() security definer;
alter function public.get_seasonality_analysis() set search_path to 'public', 'pg_temp';
alter function public.get_seasonality_analysis(integer) security definer;
alter function public.get_seasonality_analysis(integer) set search_path to 'public', 'pg_temp';

-- get_trend_analysis
alter function public.get_trend_analysis() security definer;
alter function public.get_trend_analysis() set search_path to 'public', 'pg_temp';
alter function public.get_trend_analysis(integer) security definer;
alter function public.get_trend_analysis(integer) set search_path to 'public', 'pg_temp';

-- get_weekly_summary
alter function public.get_weekly_summary() security definer;
alter function public.get_weekly_summary() set search_path to 'public', 'pg_temp';

-- get_yoy_comparison
alter function public.get_yoy_comparison() security definer;
alter function public.get_yoy_comparison() set search_path to 'public', 'pg_temp';
alter function public.get_yoy_comparison(integer) security definer;
alter function public.get_yoy_comparison(integer) set search_path to 'public', 'pg_temp';
