CREATE OR REPLACE FUNCTION public.generate_daily_digest(p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_digest_id           UUID;
    v_summary             JSONB;
    v_start               TIMESTAMPTZ := NOW() - INTERVAL '24 hours';
    v_end                 TIMESTAMPTZ := NOW();
    v_interactions        INTEGER;
    v_new_contacts        INTEGER;
    v_follow_ups_done     INTEGER;
    v_follow_ups_pending  INTEGER;
    v_highlights          TEXT[] := ARRAY[]::TEXT[];
    v_alerts              TEXT[] := ARRAY[]::TEXT[];
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  SELECT COUNT(*) INTO v_interactions
  FROM interactions WHERE created_by = p_user_id AND created_at BETWEEN v_start AND v_end;

  SELECT COUNT(*) INTO v_new_contacts
  FROM contacts WHERE created_by = p_user_id AND created_at BETWEEN v_start AND v_end;

  SELECT COUNT(*) INTO v_follow_ups_done
  FROM interactions WHERE created_by = p_user_id
    AND follow_up_required = true AND followup_concluido = true
    AND updated_at BETWEEN v_start AND v_end;

  SELECT COUNT(*) INTO v_follow_ups_pending
  FROM interactions WHERE created_by = p_user_id
    AND follow_up_required = true AND followup_concluido = false;

  IF v_new_contacts > 0 THEN
      v_highlights := array_append(v_highlights, v_new_contacts || ' novo(s) contato(s) adicionado(s)');
  END IF;
  IF v_interactions >= 10 THEN
      v_highlights := array_append(v_highlights, 'Excelente! ' || v_interactions || ' interações realizadas');
  END IF;

  IF v_follow_ups_pending > 5 THEN
      v_alerts := array_append(v_alerts, 'Você tem ' || v_follow_ups_pending || ' follow-ups pendentes');
  END IF;

  v_summary := jsonb_build_object(
      'period_start',       v_start,
      'period_end',         v_end,
      'interactions',       v_interactions,
      'new_contacts',       v_new_contacts,
      'follow_ups_completed', v_follow_ups_done,
      'follow_ups_pending', v_follow_ups_pending
  );

  INSERT INTO digest_history (
      user_id, digest_type, period_start, period_end,
      summary_data, total_interactions, new_contacts,
      follow_ups_completed, follow_ups_pending, highlights, alerts
  ) VALUES (
      p_user_id, 'daily', v_start, v_end,
      v_summary, v_interactions, v_new_contacts,
      v_follow_ups_done, v_follow_ups_pending, v_highlights, v_alerts
  )
  RETURNING id INTO v_digest_id;

  RETURN v_digest_id;
END;
$function$
