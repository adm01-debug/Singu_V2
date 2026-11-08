CREATE OR REPLACE FUNCTION public.claim_behavioral_profile_sla_batch(p_limit integer DEFAULT 5)
 RETURNS SETOF behavioral_profile_regen_queue
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_candidate record;
  v_claim public.behavioral_profile_regen_queue;
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Reserva exclusiva do serviço' USING ERRCODE = '42501';
  END IF;

  FOR v_candidate IN
    SELECT c.id, c.user_id
    FROM public.contacts AS c
    JOIN (
      SELECT feedback.contact_id, feedback.user_id
      FROM public.behavioral_insight_feedback AS feedback
      WHERE feedback.vote = -1
        AND feedback.created_at >= clock_timestamp() - interval '30 days'
      GROUP BY feedback.contact_id, feedback.user_id
      HAVING count(*) >= 3
    ) AS votes ON votes.contact_id = c.id AND votes.user_id = c.user_id
    LEFT JOIN public.behavioral_profile_regen_queue AS q ON q.contact_id = c.id
    WHERE c.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.contact_analytical_profiles AS profile
        WHERE profile.contact_id = c.id
          AND profile.last_updated_at >= clock_timestamp() - interval '24 hours'
      )
      AND (q.contact_id IS NULL OR (
        q.user_id = c.user_id
        AND q.next_run_at <= clock_timestamp()
        AND q.attempts < 5
        AND (q.last_processed_at IS NULL
          OR q.last_processed_at < clock_timestamp() - interval '24 hours')
      ))
    ORDER BY c.id
    LIMIT LEAST(GREATEST(coalesce(p_limit, 5), 0), 5)
    FOR UPDATE OF c SKIP LOCKED
  LOOP
    v_claim := public.claim_behavioral_profile_sla(v_candidate.id, v_candidate.user_id);
    IF v_claim.contact_id IS NOT NULL THEN
      RETURN NEXT v_claim;
    END IF;
  END LOOP;
  RETURN;
END;
$function$
