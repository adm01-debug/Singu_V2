CREATE OR REPLACE FUNCTION public.get_daily_summary(p_date date, p_timezone text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  WITH counts AS (
    SELECT
      (SELECT count(*) FROM companies WHERE (created_at AT TIME ZONE p_timezone)::date = p_date AND deleted_at IS NULL) AS companies,
      (SELECT count(*) FROM contacts WHERE (created_at AT TIME ZONE p_timezone)::date = p_date AND deleted_at IS NULL) AS contacts,
      (SELECT count(*) FROM deals WHERE (created_at AT TIME ZONE p_timezone)::date = p_date) AS deals,
      (SELECT count(*) FROM deals WHERE (closed_at AT TIME ZONE p_timezone)::date = p_date AND status = 'ganho') AS won,
      (SELECT count(*) FROM deals WHERE (closed_at AT TIME ZONE p_timezone)::date = p_date AND status = 'perdido') AS lost,
      (SELECT coalesce(sum(valor), 0) FROM deals WHERE (closed_at AT TIME ZONE p_timezone)::date = p_date AND status = 'ganho') AS revenue,
      (SELECT count(*) FROM interactions WHERE (data_interacao AT TIME ZONE p_timezone)::date = p_date) AS interactions,
      (SELECT count(*) FROM interactions WHERE coalesce(follow_up_date, (data_followup AT TIME ZONE p_timezone)::date) = p_date
        AND followup_concluido = true) AS completed,
      (SELECT count(*) FROM interactions WHERE coalesce(follow_up_date, (data_followup AT TIME ZONE p_timezone)::date) = p_date
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
        FROM interactions WHERE (data_interacao AT TIME ZONE p_timezone)::date = p_date GROUP BY 1) channels)
  ) FROM counts;
$function$
