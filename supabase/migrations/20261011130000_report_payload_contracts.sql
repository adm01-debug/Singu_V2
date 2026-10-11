-- Contratos de relatórios: manter campos legados e acrescentar séries do frontend.
CREATE OR REPLACE FUNCTION public.get_daily_summary(p_date date DEFAULT CURRENT_DATE)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH counts AS (
    SELECT
      (SELECT count(*) FROM companies WHERE created_at::date = p_date AND deleted_at IS NULL) AS companies,
      (SELECT count(*) FROM contacts WHERE created_at::date = p_date AND deleted_at IS NULL) AS contacts,
      (SELECT count(*) FROM deals WHERE created_at::date = p_date) AS deals,
      (SELECT count(*) FROM deals WHERE closed_at::date = p_date AND status = 'ganho') AS won,
      (SELECT count(*) FROM deals WHERE closed_at::date = p_date AND status = 'perdido') AS lost,
      (SELECT coalesce(sum(valor), 0) FROM deals WHERE closed_at::date = p_date AND status = 'ganho') AS revenue,
      (SELECT count(*) FROM interactions WHERE data_interacao::date = p_date) AS interactions,
      (SELECT count(*) FROM interactions WHERE coalesce(data_followup, follow_up_date::timestamptz)::date = p_date
        AND followup_concluido = true) AS completed,
      (SELECT count(*) FROM interactions WHERE coalesce(data_followup, follow_up_date::timestamptz)::date = p_date
        AND (requer_followup = true OR follow_up_required = true) AND NOT coalesce(followup_concluido, false)) AS pending
  )
  SELECT jsonb_build_object(
    'date', p_date, 'new_companies', companies, 'new_contacts', contacts,
    'new_deals', deals, 'deals_created', deals, 'deals_closed', won + lost,
    'deals_won', won, 'deals_lost', lost, 'revenue', revenue,
    'interactions', interactions, 'interactions_count', interactions,
    'followups_completed', completed, 'followups_pending', pending,
    'by_channel', (SELECT coalesce(jsonb_object_agg(channel, total), '{}'::jsonb)
      FROM (SELECT coalesce(channel, 'não informado') AS channel, count(*) AS total
        FROM interactions WHERE data_interacao::date = p_date GROUP BY 1) channels)
  ) FROM counts;
$$;

CREATE OR REPLACE FUNCTION public.get_channel_analysis(p_days integer DEFAULT 30)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  WITH recent AS (
    SELECT * FROM interactions WHERE created_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 3650)))
  ), channels AS (
    SELECT coalesce(channel, 'não informado') AS channel, count(*) AS total,
      count(DISTINCT company_id) AS companies, count(response_time) AS responses,
      avg(response_time) AS response_time,
      count(DISTINCT company_id) FILTER (WHERE EXISTS (
        SELECT 1 FROM deals d WHERE d.company_id = recent.company_id AND d.status = 'ganho'
          AND d.closed_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 3650)))
      )) AS converted
    FROM recent GROUP BY channel
  )
  SELECT jsonb_build_object(
    'periodo_dias', greatest(1, least(coalesce(p_days, 30), 3650)),
    'por_canal', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'canal', channel, 'total', total, 'percentual', round(100.0 * total / nullif((SELECT count(*) FROM recent), 0), 2),
      'empresas_unicas', companies) ORDER BY total DESC), '[]'::jsonb) FROM channels),
    'por_tipo', (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY total DESC), '[]'::jsonb)
      FROM (SELECT coalesce(type, 'outros') AS tipo, count(*) AS total,
        round(100.0 * count(*) / nullif((SELECT count(*) FROM recent), 0), 2) AS percentual
        FROM recent GROUP BY type) t),
    'totais', jsonb_build_object('total_interacoes', (SELECT count(*) FROM recent),
      'empresas_alcancadas', (SELECT count(DISTINCT company_id) FROM recent),
      'media_diaria', round((SELECT count(*) FROM recent)::numeric / greatest(1, least(coalesce(p_days, 30), 3650)), 2)),
    'series', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'channel', channel, 'interaction_count', total,
      'response_rate', CASE WHEN responses > 0 THEN round(100.0 * responses / total, 2) END,
      'avg_response_time', round(response_time, 2),
      'conversion_rate', round(100.0 * converted / nullif(companies, 0), 2)
    ) ORDER BY total DESC), '[]'::jsonb) FROM channels)
  );
$$;

CREATE OR REPLACE FUNCTION public.get_seasonality_analysis(p_months integer DEFAULT 12)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
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
$$;

REVOKE ALL ON FUNCTION public.get_daily_summary(date), public.get_channel_analysis(integer),
  public.get_seasonality_analysis(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_summary(date), public.get_channel_analysis(integer),
  public.get_seasonality_analysis(integer) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_relationship_consistency(p_contact_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  v_contact public.contacts%ROWTYPE;
  v_count bigint;
  v_last timestamptz;
  v_issues jsonb := '[]'::jsonb;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('consistent', false, 'issues', jsonb_build_array(
      jsonb_build_object('type', 'contact', 'expected', 'encontrado', 'actual', 'não encontrado')));
  END IF;
  SELECT count(*), max(data_interacao) INTO v_count, v_last
    FROM public.interactions WHERE contact_id = p_contact_id;
  IF v_count > 0 AND v_contact.last_interaction_at IS DISTINCT FROM v_last THEN
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('type', 'last_interaction_at',
      'expected', v_last, 'actual', v_contact.last_interaction_at));
  END IF;
  IF v_contact.relationship_score < 0 OR v_contact.relationship_score > 100 THEN
    v_issues := v_issues || jsonb_build_array(jsonb_build_object('type', 'relationship_score',
      'expected', '0 a 100', 'actual', v_contact.relationship_score));
  END IF;
  RETURN jsonb_build_object('contact_id', p_contact_id, 'consistent', jsonb_array_length(v_issues) = 0,
    'issues', v_issues, 'interactions_count', v_count, 'last_interaction_at', v_last, 'timestamp', now());
END;
$$;

-- DOWN MIGRATION (Rollback manual): restaurar as quatro definições obtidas com
-- pg_get_functiondef antes do UP, na mesma transação. get_channel_analysis(integer)
-- get_seasonality_analysis(integer) e check_relationship_consistency(uuid)
-- também estão em 20261008120000_fix_frontend_rpcs_canonical.sql.
-- Não executar a migration anterior inteira. Nenhum dado é regravado ou apagado.
-- Publicar o frontend anterior junto com o DOWN, pois ele espera os contratos antigos.
