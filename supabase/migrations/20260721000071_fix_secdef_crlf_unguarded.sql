-- Migration: fix_secdef_crlf_unguarded (Wave 157)
-- SECURITY FIX: 7 SECURITY DEFINER functions were skipped by Wave 156's
-- DO block because their bodies use CRLF (\r\n) line endings, causing
-- strpos(fn_def, '\nBEGIN\n') to return 0 for all of them.
--
-- These functions are patched here with explicit CREATE OR REPLACE,
-- inserting assert_self_user_id(p_user_id) immediately after BEGIN and
-- fixing pg_temp → pg_catalog in search_path.
--
-- Functions patched:
--   1. create_notification       — creates notification for p_user_id (no default)
--   2. create_smart_reminder     — creates reminder for p_user_id (no default)
--   3. generate_daily_digest     — reads/writes digest records for p_user_id
--   4. generate_pre_contact_briefing — p_user_id DEFAULT NULL (guard allows NULL)
--   5. generate_rapport_suggestions — reads contact data scoped to p_contact_id
--   6. get_notification_summary  — returns notification counts for p_user_id
--   7. log_activity              — inserts activity attributed to p_user_id (DEFAULT NULL)

-- ── 1. create_notification ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id     uuid,
  p_type        character varying,
  p_title       character varying,
  p_message     text                     DEFAULT NULL::text,
  p_category    character varying        DEFAULT 'normal'::character varying,
  p_contact_id  uuid                     DEFAULT NULL::uuid,
  p_action_url  text                     DEFAULT NULL::text,
  p_action_label character varying       DEFAULT NULL::character varying,
  p_metadata    jsonb                    DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
    v_notification_id UUID;
    v_priority        INTEGER;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  v_priority := CASE p_category
      WHEN 'urgent'    THEN 1
      WHEN 'important' THEN 3
      WHEN 'normal'    THEN 5
      ELSE 7
  END;

  INSERT INTO notifications (
      user_id, notification_type, category, priority,
      title, message, contact_id,
      action_url, action_label, metadata, icon
  ) VALUES (
      p_user_id, p_type, p_category, v_priority,
      p_title, p_message, p_contact_id,
      p_action_url, p_action_label, p_metadata,
      CASE p_type
          WHEN 'follow_up'            THEN '📞'
          WHEN 'meeting'              THEN '📅'
          WHEN 'alert'                THEN '⚠️'
          WHEN 'churn_risk'           THEN '🚨'
          WHEN 'closing_opportunity'  THEN '🎯'
          WHEN 'birthday'             THEN '🎂'
          WHEN 'task'                 THEN '✅'
          ELSE '📌'
      END
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- ── 2. create_smart_reminder ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_smart_reminder(
  p_user_id          uuid,
  p_title            character varying,
  p_remind_at        timestamp with time zone,
  p_contact_id       uuid                   DEFAULT NULL::uuid,
  p_description      text                   DEFAULT NULL::text,
  p_reminder_type    character varying      DEFAULT 'custom'::character varying,
  p_priority         character varying      DEFAULT 'normal'::character varying,
  p_suggested_actions text[]               DEFAULT NULL::text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
    v_reminder_id UUID;
    v_context     JSONB := '{}'::JSONB;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  IF p_contact_id IS NOT NULL THEN
      SELECT jsonb_build_object(
          'contact_name',       COALESCE(c.full_name, c.first_name || ' ' || c.last_name),
          'company',            COALESCE(co.title, co.razao_social),
          'disc_type',          da.primary_profile,
          'last_interaction',   (SELECT MAX(data_interacao) FROM interactions WHERE contact_id = c.id),
          'relationship_score', c.relationship_score
      ) INTO v_context
      FROM contacts c
      LEFT JOIN companies co ON c.company_id = co.id
      LEFT JOIN disc_assessments da ON c.id = da.contact_id AND da.is_current = true
      WHERE c.id = p_contact_id;
  END IF;

  INSERT INTO smart_reminders (
      user_id, reminder_type, contact_id, title, description,
      remind_at, priority, context_data, suggested_actions
  ) VALUES (
      p_user_id, p_reminder_type, p_contact_id, p_title, p_description,
      p_remind_at, p_priority, v_context,
      COALESCE(p_suggested_actions, ARRAY['Fazer contato', 'Enviar mensagem', 'Agendar reunião'])
  )
  RETURNING id INTO v_reminder_id;

  RETURN v_reminder_id;
END;
$$;

-- ── 3. generate_daily_digest ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_daily_digest(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
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
$$;

-- ── 4. generate_pre_contact_briefing ─────────────────────────────────────────
-- p_user_id DEFAULT NULL::uuid — guard allows NULL (service_role or anonymous
-- briefing generation). Authenticated users cannot generate briefings that are
-- attributed to another user's UUID.
CREATE OR REPLACE FUNCTION public.generate_pre_contact_briefing(
  p_contact_id   uuid,
  p_contact_type character varying DEFAULT 'call'::character varying,
  p_user_id      uuid              DEFAULT NULL::uuid
)
RETURNS TABLE(
  briefing_id             uuid,
  contact_name            text,
  company_name            text,
  disc_profile            character varying,
  approach_tips           text[],
  rapport_points          text[],
  key_questions           text[],
  anticipated_objections  text[],
  recommended_approach    text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_id        UUID;
  v_name      TEXT;
  v_company   TEXT;
  v_disc      VARCHAR(10);
  v_tips      TEXT[] := ARRAY[]::TEXT[];
  v_rapport   TEXT[] := ARRAY[]::TEXT[];
  v_questions TEXT[];
  v_objections TEXT[];
  v_approach  TEXT;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  SELECT COALESCE(c.full_name, c.first_name || ' ' || c.last_name),
         COALESCE(co.title, co.razao_social)
  INTO v_name, v_company
  FROM contacts c
  LEFT JOIN companies co ON c.company_id = co.id
  WHERE c.id = p_contact_id;

  SELECT primary_profile INTO v_disc
  FROM disc_assessments WHERE contact_id = p_contact_id AND is_current = true;

  IF v_disc = 'D' THEN
    v_tips := ARRAY['Seja direto', 'Foque em resultados', 'Evite detalhes'];
    v_approach := 'Direto, focado em resultados.';
  ELSIF v_disc = 'I' THEN
    v_tips := ARRAY['Seja entusiasta', 'Use histórias', 'Permita que fale'];
    v_approach := 'Social e entusiasta.';
  ELSIF v_disc = 'S' THEN
    v_tips := ARRAY['Seja paciente', 'Construa confiança', 'Não pressione'];
    v_approach := 'Calma e paciente.';
  ELSIF v_disc = 'C' THEN
    v_tips := ARRAY['Traga dados', 'Seja preciso', 'Documente'];
    v_approach := 'Analítica com dados.';
  ELSE
    v_tips := ARRAY['Observe as reações', 'Adapte conforme feedback'];
    v_approach := 'Observe e adapte.';
  END IF;

  SELECT array_agg(DISTINCT si.interest_name) INTO v_rapport
  FROM shared_interests si
  WHERE si.contact_id = p_contact_id AND si.is_active = true LIMIT 5;

  IF v_rapport IS NULL THEN v_rapport := ARRAY['Pergunte sobre o dia']; END IF;

  v_questions := ARRAY[
    'Qual o principal desafio atual?',
    'O que seria ideal?',
    'Qual o timeline?',
    'Quem mais decide?'
  ];

  SELECT array_agg(DISTINCT o.objection_text) INTO v_objections
  FROM objections o
  WHERE o.contact_id = p_contact_id AND o.status != 'resolved' LIMIT 3;

  IF v_objections IS NULL THEN v_objections := ARRAY['Preço', 'Prazo', 'Aprovação']; END IF;

  INSERT INTO pre_contact_briefings (
      contact_id, user_id, planned_contact_type, contact_summary,
      disc_profile, disc_approach_tips, rapport_points, key_questions,
      anticipated_objections, recommended_approach, primary_objective
  ) VALUES (
      p_contact_id, p_user_id, p_contact_type,
      'Contato: ' || v_name || ' | ' || v_company,
      v_disc, v_tips, v_rapport, v_questions,
      v_objections, v_approach, 'Avançar relacionamento'
  )
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_name, v_company, v_disc,
                      v_tips, v_rapport, v_questions, v_objections, v_approach;
END;
$$;

-- ── 5. generate_rapport_suggestions ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_rapport_suggestions(
  p_user_id    uuid,
  p_contact_id uuid
)
RETURNS TABLE(
  contact_id          uuid,
  rapport_score       integer,
  mirroring_tips      text[],
  shared_interests    jsonb,
  conversation_starters text[],
  topics_to_avoid     text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_rapport   INTEGER := 50;
  v_mirroring TEXT[]  := ARRAY[]::TEXT[];
  v_interests JSONB;
  v_starters  TEXT[]  := ARRAY[]::TEXT[];
  v_avoid     TEXT[]  := ARRAY[]::TEXT[];
  v_comm      RECORD;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  SELECT * INTO v_comm
  FROM contact_communication_style
  WHERE contact_communication_style.contact_id = p_contact_id
    AND is_current = true;

  IF v_comm.pace = 'fast' THEN
    v_mirroring := array_append(v_mirroring, 'Fale de forma rápida e objetiva');
  ELSIF v_comm.pace = 'slow' THEN
    v_mirroring := array_append(v_mirroring, 'Diminua o ritmo, dê tempo');
  END IF;

  IF v_comm.tone = 'formal' THEN
    v_mirroring := array_append(v_mirroring, 'Use linguagem formal');
  ELSIF v_comm.tone = 'casual' THEN
    v_mirroring := array_append(v_mirroring, 'Pode usar tom descontraído');
  END IF;

  IF v_comm.prefers_data    THEN v_mirroring := array_append(v_mirroring, 'Traga dados e números'); END IF;
  IF v_comm.prefers_stories THEN v_mirroring := array_append(v_mirroring, 'Use histórias e cases'); END IF;

  SELECT jsonb_agg(jsonb_build_object(
      'category', si.interest_category,
      'name',     si.interest_name,
      'value',    si.rapport_value
  )) INTO v_interests
  FROM shared_interests si
  WHERE si.contact_id = p_contact_id AND si.is_active = true;

  SELECT array_agg(DISTINCT unnest) INTO v_starters
  FROM (
      SELECT unnest(si.conversation_starters)
      FROM shared_interests si
      WHERE si.contact_id = p_contact_id AND si.is_active = true LIMIT 10
  ) AS starters;

  v_avoid := COALESCE(v_comm.disengagement_triggers, ARRAY[]::TEXT[]);

  SELECT COALESCE(rsh.rapport_score, 50) INTO v_rapport
  FROM rapport_score_history rsh
  WHERE rsh.contact_id = p_contact_id AND rsh.is_current = true;

  IF array_length(v_mirroring, 1) IS NULL THEN
    v_mirroring := ARRAY['Observe e espelhe o ritmo'];
  END IF;
  IF array_length(v_starters, 1) IS NULL THEN
    v_starters := ARRAY['Pergunte sobre o dia/semana'];
  END IF;

  RETURN QUERY
    SELECT p_contact_id, v_rapport, v_mirroring,
           COALESCE(v_interests, '[]'::JSONB),
           COALESCE(v_starters, ARRAY[]::TEXT[]),
           COALESCE(v_avoid,    ARRAY[]::TEXT[]);
END;
$$;

-- ── 6. get_notification_summary ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_notification_summary(p_user_id uuid)
RETURNS TABLE(
  total_unread      integer,
  urgent_count      integer,
  follow_ups_today  integer,
  meetings_today    integer,
  alerts_active     integer,
  reminders_overdue integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM notifications
     WHERE user_id = p_user_id AND is_read = false AND is_dismissed = false),
    (SELECT COUNT(*)::INTEGER FROM notifications
     WHERE user_id = p_user_id AND is_read = false AND category = 'urgent'),
    (SELECT COUNT(*)::INTEGER FROM smart_reminders
     WHERE user_id = p_user_id AND reminder_type = 'follow_up'
       AND DATE(remind_at) = CURRENT_DATE AND status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM smart_reminders
     WHERE user_id = p_user_id AND reminder_type = 'meeting'
       AND DATE(remind_at) = CURRENT_DATE AND status = 'pending'),
    (SELECT COUNT(*)::INTEGER FROM inactivity_alerts WHERE status = 'active'),
    (SELECT COUNT(*)::INTEGER FROM smart_reminders
     WHERE user_id = p_user_id AND status = 'pending' AND remind_at < NOW());
END;
$$;

-- ── 7. log_activity ───────────────────────────────────────────────────────────
-- p_user_id DEFAULT NULL::uuid — guard allows NULL (used when logging system
-- or background events with no specific user context). Authenticated users
-- cannot log activities attributed to another user's UUID.
CREATE OR REPLACE FUNCTION public.log_activity(
  p_type           text,
  p_description    text,
  p_contact_id     uuid    DEFAULT NULL::uuid,
  p_company_id     uuid    DEFAULT NULL::uuid,
  p_interaction_id uuid    DEFAULT NULL::uuid,
  p_data           jsonb   DEFAULT '{}'::jsonb,
  p_user_id        uuid    DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_id UUID;
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);

  INSERT INTO activities (
      user_id, type, description,
      contact_id, company_id, interaction_id, data
  ) VALUES (
      p_user_id, p_type, p_description,
      p_contact_id, p_company_id, p_interaction_id, p_data
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  still_unguarded int;
BEGIN
  SELECT COUNT(*) INTO still_unguarded
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
    AND pg_get_function_arguments(p.oid)  LIKE '%p_user_id %'
    AND pg_get_function_arguments(p.oid) NOT LIKE '%p_user_ids%'
    AND pg_get_functiondef(p.oid)        NOT LIKE '%assert_self_user_id%'
    AND p.proname NOT LIKE 'singu_%';

  RAISE NOTICE '[Wave 157] Remaining unguarded p_user_id functions (excl. singu_*): %',
               still_unguarded;
END;
$$;
