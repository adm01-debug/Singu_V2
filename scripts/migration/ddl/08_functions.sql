-- Generated 2026-07-21T16:17:01Z

CREATE OR REPLACE FUNCTION public._connection_encryption_key()
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  k text;
BEGIN
  -- Tenta GUC configurado por admin (set em ALTER DATABASE não permitido aqui;
  -- deve ser definido via Supabase Vault ou variável de ambiente da função).
  BEGIN
    k := current_setting('app.connection_encryption_key', true);
  EXCEPTION WHEN others THEN
    k := NULL;
  END;
  IF k IS NULL OR length(k) < 16 THEN
    -- Fallback determinístico (NÃO ideal, mas evita crash; admin deve configurar GUC).
    k := encode(digest('singu-connection-default-key-v1', 'sha256'), 'hex');
  END IF;
  RETURN k;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.aggregate_nlp_to_company(p_company_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    UPDATE public.companies
    SET 
        vak_dominant = (
            SELECT vak_dominant
            FROM public.contacts
            WHERE company_id = p_company_id AND vak_dominant IS NOT NULL
            GROUP BY vak_dominant
            ORDER BY COUNT(*) DESC, vak_dominant ASC
            LIMIT 1
        ),
        motivation_direction = (
            SELECT motivation_direction
            FROM public.contacts
            WHERE company_id = p_company_id AND motivation_direction IS NOT NULL
            GROUP BY motivation_direction
            ORDER BY COUNT(*) DESC, motivation_direction ASC
            LIMIT 1
        ),
        working_style = (
            SELECT working_style
            FROM public.contacts
            WHERE company_id = p_company_id AND working_style IS NOT NULL
            GROUP BY working_style
            ORDER BY COUNT(*) DESC, working_style ASC
            LIMIT 1
        )
    WHERE id = p_company_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.audit_connection_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_user uuid;
BEGIN
  v_user := COALESCE(auth.uid(), NEW.created_by, OLD.created_by);

  IF TG_OP = 'DELETE' THEN
    v_old := to_jsonb(OLD);
    v_new := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := to_jsonb(NEW);
  ELSE
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  END IF;

  -- Mascarar campos sensíveis
  IF v_old IS NOT NULL THEN
    IF v_old ? 'config' THEN v_old := jsonb_set(v_old, '{config}', '"***masked***"'::jsonb); END IF;
    IF v_old ? 'encrypted_config' THEN v_old := v_old - 'encrypted_config'; END IF;
    IF v_old ? 'webhook_secret' AND v_old->>'webhook_secret' IS NOT NULL THEN
      v_old := jsonb_set(v_old, '{webhook_secret}', '"***masked***"'::jsonb);
    END IF;
    IF v_old ? 'token' THEN v_old := jsonb_set(v_old, '{token}', '"***masked***"'::jsonb); END IF;
  END IF;
  IF v_new IS NOT NULL THEN
    IF v_new ? 'config' THEN v_new := jsonb_set(v_new, '{config}', '"***masked***"'::jsonb); END IF;
    IF v_new ? 'encrypted_config' THEN v_new := v_new - 'encrypted_config'; END IF;
    IF v_new ? 'webhook_secret' AND v_new->>'webhook_secret' IS NOT NULL THEN
      v_new := jsonb_set(v_new, '{webhook_secret}', '"***masked***"'::jsonb);
    END IF;
    IF v_new ? 'token' THEN v_new := jsonb_set(v_new, '{token}', '"***masked***"'::jsonb); END IF;
  END IF;

  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    v_user,
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_old,
    v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.audit_life_events()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_reason TEXT;
BEGIN
    -- Extract reason from metadata if exists
    v_reason := COALESCE(NEW.metadata->>'reason', OLD.metadata->>'reason');

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            NEW.id, NEW.contact_id, NEW.user_id, NEW.event_type, NEW.title, NEW.event_date, NEW.recurring, NEW.reminder_days_before, 'INSERT', COALESCE(v_reason, 'Evento criado')
        );
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            NEW.id, NEW.contact_id, NEW.user_id, NEW.event_type, NEW.title, NEW.event_date, NEW.recurring, NEW.reminder_days_before, 'UPDATE', COALESCE(v_reason, 'Evento atualizado')
        );
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.life_events_history (
            life_event_id, contact_id, user_id, event_type, title, event_date, recurring, reminder_days_before, change_type, reason
        ) VALUES (
            OLD.id, OLD.contact_id, OLD.user_id, OLD.event_type, OLD.title, OLD.event_date, OLD.recurring, OLD.reminder_days_before, 'DELETE', COALESCE(v_reason, 'Evento removido')
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, old_data, new_data, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), NEW.user_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, old_data, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD), OLD.user_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.auto_ack_stale_mtta_sla_breaches()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.system_alerts
     SET acknowledged_at = now(),
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_ack_reason', 'sla_window_expired')
   WHERE alert_type = 'mtta_critical_sla_breach'
     AND acknowledged_at IS NULL
     AND created_at < now() - interval '24 hours';
  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Heartbeat: registra execução do cron para observabilidade (detecta cron travado).
  INSERT INTO public.system_health_snapshots (status, components)
  VALUES (
    'healthy',
    jsonb_build_object(
      'source', 'cron_mtta_auto_ack',
      'acked_count', v_count,
      'ran_at', now()
    )
  );

  RETURN v_count;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.auto_reset_leads_on_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.leads_today_reset_at IS NULL OR OLD.leads_today_reset_at::date < CURRENT_DATE THEN
    -- If leads_today is being incremented, reset it first then add 1
    IF NEW.leads_today > OLD.leads_today THEN
      NEW.leads_today := 1;
    ELSE
      NEW.leads_today := 0;
    END IF;
    NEW.leads_today_reset_at := now();
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.buyer_add_comment(_token text, _body text, _label text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _room public.deal_rooms;
  _id UUID;
BEGIN
  IF _body IS NULL OR length(trim(_body)) = 0 OR length(_body) > 4000 THEN
    RAISE EXCEPTION 'Invalid comment';
  END IF;

  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.deal_room_comments (room_id, user_id, author_side, author_label, body)
  VALUES (_room.id, _room.user_id, 'buyer', COALESCE(_label,'Buyer'), _body)
  RETURNING id INTO _id;

  INSERT INTO public.deal_room_activities (room_id, user_id, actor_side, actor_label, activity_type, payload)
  VALUES (_room.id, _room.user_id, 'buyer', COALESCE(_label,'Buyer'), 'comment', jsonb_build_object('comment_id', _id));

  RETURN _id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.buyer_toggle_milestone(_token text, _milestone_id uuid, _done boolean, _label text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _room public.deal_rooms;
  _ms public.deal_room_milestones;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN false; END IF;

  SELECT * INTO _ms FROM public.deal_room_milestones WHERE id = _milestone_id AND room_id = _room.id;
  IF _ms.id IS NULL OR _ms.owner_side = 'seller' THEN RETURN false; END IF;

  UPDATE public.deal_room_milestones
  SET status = CASE WHEN _done THEN 'done' ELSE 'pending' END,
      completed_at = CASE WHEN _done THEN now() ELSE NULL END,
      completed_by_side = CASE WHEN _done THEN 'buyer' ELSE NULL END
  WHERE id = _milestone_id;

  INSERT INTO public.deal_room_activities (room_id, user_id, actor_side, actor_label, activity_type, payload)
  VALUES (_room.id, _room.user_id, 'buyer', COALESCE(_label,'Buyer'),
          CASE WHEN _done THEN 'milestone_completed' ELSE 'milestone_reopened' END,
          jsonb_build_object('milestone_id', _milestone_id, 'title', _ms.title));

  RETURN true;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.calculate_interaction_response_time()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    last_interaction RECORD;
BEGIN
    -- Only calculate if it's initiated by 'us'
    IF (NEW.initiated_by = 'us') THEN
        -- Find the most recent interaction from this contact ('them')
        SELECT created_at INTO last_interaction
        FROM public.interactions
        WHERE contact_id = NEW.contact_id
          AND initiated_by = 'them'
          AND created_at < NEW.created_at
        ORDER BY created_at DESC
        LIMIT 1;

        IF FOUND THEN
            -- Calculate difference in minutes
            NEW.response_time := EXTRACT(EPOCH FROM (NEW.created_at - last_interaction.created_at)) / 60;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.calculate_next_contact_due()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- If we have a last contact date and cadence days, calculate next due
    IF (NEW.last_contact_at IS NOT NULL AND NEW.cadence_days IS NOT NULL) THEN
        NEW.next_contact_due := NEW.last_contact_at + (NEW.cadence_days || ' days')::interval;
    END IF;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.calculate_relationship_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        PERFORM public.calculate_relationship_metrics_internal(OLD.contact_id);
    ELSE
        PERFORM public.calculate_relationship_metrics_internal(NEW.contact_id);
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.calculate_relationship_metrics_for_contact(p_contact_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Simplesmente dispara a função existente, simulando uma atualização de contato
    -- que ativará o trigger (ou chamando a função diretamente se preferir isolar)
    -- Para este sistema, chamaremos a função calculate_relationship_metrics mockando o trigger
    
    -- Atualiza o contato para forçar o trigger calculate_relationship_metrics()
    -- Mas como o trigger é AFTER, precisamos garantir que ele rode.
    -- Alternativamente, movemos a lógica para uma função que pode ser chamada por ambos.
    
    PERFORM public.calculate_relationship_metrics_internal(p_contact_id);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.calculate_relationship_metrics_internal(v_contact_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_score FLOAT := 0;
    v_sentiment TEXT := 'neutral';
    v_interactions_count INTEGER;
    v_last_date TIMESTAMP WITH TIME ZONE;
    v_avg_sentiment FLOAT;
    v_days_since_last INTEGER;
    v_stage TEXT;
    v_quality_score FLOAT := 0;
    v_interaction_record RECORD;
BEGIN
    -- [LOGICA IDENTICA A calculate_relationship_metrics ANTERIOR]
    SELECT count(*), max(created_at) INTO v_interactions_count, v_last_date
    FROM public.interactions WHERE contact_id = v_contact_id;
    v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));
    SELECT relationship_stage INTO v_stage FROM public.contacts WHERE id = v_contact_id;

    FOR v_interaction_record IN (
        SELECT type, content, transcription, duration, sentiment, created_at
        FROM public.interactions WHERE contact_id = v_contact_id
        ORDER BY created_at DESC LIMIT 10
    ) LOOP
        DECLARE v_this_weight FLOAT := 1.0;
        BEGIN
            IF v_interaction_record.type = 'meeting' THEN v_this_weight := 3.0;
            ELSIF v_interaction_record.type = 'call' THEN v_this_weight := 2.0;
            ELSE v_this_weight := 1.0; END IF;
            v_quality_score := v_quality_score + v_this_weight;
        END;
    END LOOP;

    SELECT AVG(CASE WHEN sentiment = 'positive' THEN 100 WHEN sentiment = 'negative' THEN 0 ELSE 50 END)
    INTO v_avg_sentiment FROM public.interactions WHERE contact_id = v_contact_id;

    v_score := LEAST(v_quality_score * 5, 40) + (COALESCE(v_avg_sentiment, 50) * 0.3);
    IF v_days_since_last <= 7 THEN v_score := v_score + 30;
    ELSIF v_days_since_last <= 30 THEN v_score := v_score + 15; END IF;

    UPDATE public.contacts
    SET relationship_score = ROUND(v_score), updated_at = now()
    WHERE id = v_contact_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.check_at_risk_contacts()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Marcar como at_risk se score cair abaixo de 30 ou > 30 dias sem contato (exceto se já lost)
    UPDATE public.contacts
    SET relationship_stage = 'at_risk'
    WHERE relationship_stage NOT IN ('lost', 'at_risk')
    AND (relationship_score < 30 OR days_without_contact > 30);

    -- Gerar notificações/alertas (se a tabela de alertas existir)
    INSERT INTO public.alerts (user_id, contact_id, title, description, type, priority)
    SELECT user_id, id, 'Contato em Risco', 'O contato está sem interação há mais de 30 dias.', 'relationship', 'high'
    FROM public.contacts
    WHERE relationship_stage = 'at_risk'
    AND NOT EXISTS (
        SELECT 1 FROM public.alerts 
        WHERE contact_id = contacts.id 
        AND title = 'Contato em Risco' 
        AND dismissed = false
    );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.check_behavioral_regen_cron_staleness()
 RETURNS TABLE(job text, minutes_since_last_run integer, alert_created boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'cron'
AS $function$
DECLARE
  r RECORD;
  mins int;
  expected_max int;
  existing_alert uuid;
  created boolean;
BEGIN
  FOR r IN
    SELECT j.jobid, j.jobname, j.active,
           (SELECT max(d.start_time) FROM cron.job_run_details d WHERE d.jobid = j.jobid) AS last_run
    FROM cron.job j
    WHERE j.jobname IN (
      'process-behavioral-regen-queue-5min',
      'cleanup-behavioral-regen-queue-daily'
    )
  LOOP
    IF r.last_run IS NULL THEN
      mins := 999999;
    ELSE
      mins := FLOOR(EXTRACT(EPOCH FROM (now() - r.last_run)) / 60)::int;
    END IF;

    expected_max := CASE WHEN r.jobname LIKE '%5min%' THEN 30 ELSE 60 * 26 END;
    created := false;

    IF r.active AND mins > expected_max THEN
      SELECT id INTO existing_alert
      FROM public.system_alerts
      WHERE alert_type = 'behavioral_regen_cron_stale'
        AND (metadata->>'jobname') = r.jobname
        AND acknowledged_at IS NULL
      LIMIT 1;

      IF existing_alert IS NULL THEN
        INSERT INTO public.system_alerts (
          alert_type, severity, threshold_pct, consumed_pct, message, metadata
        ) VALUES (
          'behavioral_regen_cron_stale',
          CASE WHEN mins > expected_max * 2 THEN 'critical' ELSE 'warning' END,
          expected_max,
          mins,
          format('Cron "%s" sem executar há %s min (esperado ≤ %s min)', r.jobname, mins, expected_max),
          jsonb_build_object('jobname', r.jobname, 'last_run', r.last_run, 'expected_max_min', expected_max)
        );
        created := true;
      END IF;
    END IF;

    job := r.jobname;
    minutes_since_last_run := mins;
    alert_created := created;
    RETURN NEXT;
  END LOOP;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.check_contact_health_alerts()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- 1. Alertas de Inatividade para Prospects/Oportunidades
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'no_contact', 
        'medium',
        'Falta de contato com ' || relationship_stage || ' há ' || EXTRACT(DAY FROM (now() - last_interaction_at)) || ' dias.',
        CASE 
            WHEN relationship_stage = 'prospect' THEN 'Envie um recurso de valor (artigo/ebook) para reaquecer.'
            WHEN relationship_stage = 'qualified_lead' THEN 'Agende uma breve ligação de diagnóstico.'
            WHEN relationship_stage = 'opportunity' THEN 'Apresente um caso de sucesso similar para destravar a decisão.'
            ELSE 'Inicie uma conversa casual para manter o rapport.'
        END
    FROM public.contacts
    WHERE last_interaction_at < now() - interval '15 days'
    AND relationship_stage IN ('prospect', 'qualified_lead', 'opportunity', 'negotiation')
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'no_contact' 
        AND is_resolved = false
    );

    -- 2. Alertas de Risco de Churn (Score Baixo em Clientes)
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'at_risk', 
        'high',
        'Alerta de Churn: Score caiu para ' || relationship_score || '.',
        'Agende uma Reunião de Sucesso (QBR) imediatamente para ouvir as dores do cliente.'
    FROM public.contacts
    WHERE relationship_score < 40
    AND relationship_stage IN ('customer', 'loyal_customer')
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'at_risk' 
        AND is_resolved = false
    );

    -- 3. Alertas de Follow-up para Advocates (Manutenção de Promotores)
    INSERT INTO public.crm_alerts (user_id, contact_id, type, severity, message, suggested_action)
    SELECT 
        user_id, 
        id, 
        'follow_up', 
        'low',
        'Mantenha seu Promotor engajado! Sem contato há 30 dias.',
        'Convide-o para um evento exclusivo ou peça um depoimento/indicação.'
    FROM public.contacts
    WHERE last_interaction_at < now() - interval '30 days'
    AND relationship_stage = 'advocate'
    AND NOT EXISTS (
        SELECT 1 FROM public.crm_alerts 
        WHERE contact_id = public.contacts.id 
        AND type = 'follow_up' 
        AND is_resolved = false
    );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.check_mbti_consistency()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only check if both type and relevant scores are present
    IF NEW.mbti_type IS NOT NULL THEN
        IF NEW.mbti_e_i_score IS NOT NULL AND 
           ((NEW.mbti_type LIKE 'E%' AND NEW.mbti_e_i_score < 50) OR (NEW.mbti_type LIKE 'I%' AND NEW.mbti_e_i_score > 50)) THEN
            RAISE EXCEPTION 'MBTI Type % inconsistent with E/I score %', NEW.mbti_type, NEW.mbti_e_i_score;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.check_mtta_auto_ack_heartbeat()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  last_beat TIMESTAMPTZ;
  age_min INT;
  recent_alert BOOLEAN;
BEGIN
  SELECT MAX(timestamp) INTO last_beat
  FROM public.system_health_snapshots
  WHERE components->>'source' = 'cron_mtta_auto_ack'
    AND timestamp > now() - interval '24 hours';

  IF last_beat IS NULL THEN
    age_min := NULL;
  ELSE
    age_min := EXTRACT(EPOCH FROM (now() - last_beat)) / 60;
  END IF;

  -- Só alerta se sinal ausente OU >150min
  IF age_min IS NOT NULL AND age_min <= 150 THEN
    RETURN;
  END IF;

  -- Dedup: já existe alerta aberto/recente (6h) do mesmo tipo?
  SELECT EXISTS (
    SELECT 1 FROM public.system_alerts
    WHERE alert_type = 'mtta_auto_ack_heartbeat_stale'
      AND created_at > now() - interval '6 hours'
  ) INTO recent_alert;

  IF recent_alert THEN
    RETURN;
  END IF;

  INSERT INTO public.system_alerts (alert_type, severity, message, metadata)
  VALUES (
    'mtta_auto_ack_heartbeat_stale',
    'critical',
    CASE
      WHEN age_min IS NULL THEN 'Cron mtta-sla-breach-auto-ack-hourly sem heartbeat nas últimas 24h'
      ELSE format('Cron mtta-sla-breach-auto-ack-hourly travado há %s min (SLA 150min)', age_min)
    END,
    jsonb_build_object(
      'age_minutes', age_min,
      'threshold_minutes', 150,
      'last_beat', last_beat,
      'cron_job', 'mtta-sla-breach-auto-ack-hourly'
    )
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.check_relationship_consistency(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_contact RECORD;
    v_int_count INTEGER;
    v_last_int TIMESTAMP WITH TIME ZONE;
    v_issues JSONB := '[]'::jsonb;
BEGIN
    SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;
    
    -- Verificar contagem de interações
    SELECT count(*), max(created_at) INTO v_int_count, v_last_int
    FROM public.interactions WHERE contact_id = p_contact_id;
    
    IF v_contact.interactions_count != v_int_count THEN
        v_issues := v_issues || jsonb_build_object(
            'type', 'count_mismatch',
            'expected', v_int_count,
            'actual', v_contact.interactions_count
        );
    END IF;
    
    IF v_contact.last_interaction_at IS DISTINCT FROM v_last_int THEN
        v_issues := v_issues || jsonb_build_object(
            'type', 'last_contact_mismatch',
            'expected', v_last_int,
            'actual', v_contact.last_interaction_at
        );
    END IF;

    RETURN jsonb_build_object(
        'contact_id', p_contact_id,
        'consistent', jsonb_array_length(v_issues) = 0,
        'issues', v_issues,
        'timestamp', now()
    );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.cleanup_behavioral_regen_queue(_retention_days integer DEFAULT 30, _max_attempts integer DEFAULT 5, _dead_letter_backoff_days integer DEFAULT 7)
 RETURNS TABLE(deleted_success integer, parked_dead_letter integer, retention_days integer, max_attempts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted INTEGER := 0;
  v_parked  INTEGER := 0;
BEGIN
  -- Somente admins podem chamar via API. service_role bypassa por default.
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'acesso negado: requer admin';
  END IF;

  -- 1) Remove linhas processadas com sucesso há mais de _retention_days
  WITH d AS (
    DELETE FROM public.behavioral_profile_regen_queue
    WHERE last_error IS NULL
      AND last_processed_at IS NOT NULL
      AND last_processed_at < now() - make_interval(days => _retention_days)
    RETURNING 1
  )
  SELECT count(*)::int INTO v_deleted FROM d;

  -- 2) "Dead letter": itens que estouraram _max_attempts recebem next_run_at
  --    empurrado para longe (evita loop do cron), mas ficam visíveis na auditoria.
  WITH p AS (
    UPDATE public.behavioral_profile_regen_queue
    SET next_run_at = now() + make_interval(days => _dead_letter_backoff_days),
        updated_at  = now()
    WHERE attempts >= _max_attempts
      AND last_error IS NOT NULL
      AND next_run_at < now() + interval '1 day'
    RETURNING 1
  )
  SELECT count(*)::int INTO v_parked FROM p;

  RETURN QUERY SELECT v_deleted, v_parked, _retention_days, _max_attempts;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.cleanup_old_health_snapshots()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.system_health_snapshots
  WHERE timestamp < now() - INTERVAL '60 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  DELETE FROM public.system_alerts
  WHERE acknowledged_at IS NOT NULL
    AND created_at < now() - INTERVAL '90 days';

  RETURN deleted_count;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.cleanup_simulated_alerts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.system_alerts
  WHERE is_simulated = true
    AND created_at < now() - interval '7 days';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.compute_account_health(_account_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _account public.cs_accounts;
  _weighted_sum NUMERIC := 0;
  _weight_total NUMERIC := 0;
  _final_score INT := 50;
  _signal RECORD;
  _decay NUMERIC;
  _days_ago NUMERIC;
  _previous_score INT;
  _trend TEXT := 'stable';
  _breakdown JSONB := '{}'::jsonb;
  _category_sums JSONB := '{}'::jsonb;
BEGIN
  SELECT * INTO _account FROM public.cs_accounts WHERE id = _account_id;
  IF _account.id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;
  IF auth.uid() IS NULL OR auth.uid() <> _account.user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  _previous_score := _account.health_score;

  FOR _signal IN
    SELECT signal_type, score, weight, captured_at
    FROM public.cs_health_signals
    WHERE account_id = _account_id
      AND captured_at >= now() - INTERVAL '90 days'
  LOOP
    _days_ago := EXTRACT(EPOCH FROM (now() - _signal.captured_at)) / 86400.0;
    _decay := exp(-_days_ago / 45.0); -- meia-vida ~31 dias
    _weighted_sum := _weighted_sum + (_signal.score * _signal.weight * _decay);
    _weight_total := _weight_total + (_signal.weight * _decay);
  END LOOP;

  IF _weight_total > 0 THEN
    _final_score := GREATEST(0, LEAST(100, ROUND(_weighted_sum / _weight_total)::INT));
  END IF;

  IF _final_score - _previous_score >= 5 THEN
    _trend := 'up';
  ELSIF _previous_score - _final_score >= 5 THEN
    _trend := 'down';
  END IF;

  UPDATE public.cs_accounts
  SET health_score = _final_score,
      health_trend = _trend,
      last_health_recalc_at = now(),
      lifecycle_stage = CASE
        WHEN _final_score < 40 THEN 'at_risk'
        WHEN lifecycle_stage = 'at_risk' AND _final_score >= 60 THEN 'mature'
        ELSE lifecycle_stage
      END
  WHERE id = _account_id;

  RETURN jsonb_build_object(
    'account_id', _account_id,
    'previous_score', _previous_score,
    'new_score', _final_score,
    'trend', _trend,
    'signals_considered', (SELECT COUNT(*) FROM public.cs_health_signals WHERE account_id = _account_id AND captured_at >= now() - INTERVAL '90 days')
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.compute_attribution(_deal_id text, _model text DEFAULT 'linear'::text, _deal_value numeric DEFAULT 0)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _allocations JSONB := '[]'::jsonb;
  _tps RECORD;
  _count INT := 0;
  _total INT;
  _share NUMERIC;
  _arr JSONB := '[]'::jsonb;
  _i INT := 0;
BEGIN
  SELECT COUNT(*) INTO _total
  FROM public.attribution_touchpoints
  WHERE user_id = auth.uid() AND deal_id = _deal_id;

  IF _total = 0 THEN
    RETURN jsonb_build_object('model', _model, 'allocations', '[]'::jsonb, 'total_value', _deal_value);
  END IF;

  FOR _tps IN
    SELECT id, touchpoint_type, source, medium, campaign, occurred_at
    FROM public.attribution_touchpoints
    WHERE user_id = auth.uid() AND deal_id = _deal_id
    ORDER BY occurred_at ASC
  LOOP
    _share := CASE _model
      WHEN 'first' THEN CASE WHEN _i = 0 THEN 1 ELSE 0 END
      WHEN 'last' THEN CASE WHEN _i = _total - 1 THEN 1 ELSE 0 END
      WHEN 'linear' THEN 1.0 / _total
      WHEN 'u_shape' THEN
        CASE
          WHEN _total = 1 THEN 1
          WHEN _total = 2 THEN 0.5
          WHEN _i = 0 OR _i = _total - 1 THEN 0.4
          ELSE 0.2 / (_total - 2)
        END
      WHEN 'w_shape' THEN
        CASE
          WHEN _total <= 2 THEN 1.0 / _total
          WHEN _total = 3 THEN CASE WHEN _i = 1 THEN 0.3 ELSE 0.35 END
          WHEN _i = 0 OR _i = _total - 1 OR _i = (_total / 2) THEN 0.3
          ELSE 0.1 / (_total - 3)
        END
      WHEN 'time_decay' THEN power(2, _i::numeric / GREATEST(_total - 1, 1)) / (
        SELECT SUM(power(2, g::numeric / GREATEST(_total - 1, 1))) FROM generate_series(0, _total - 1) g
      )
      ELSE 1.0 / _total
    END;

    _arr := _arr || jsonb_build_object(
      'touchpoint_id', _tps.id,
      'type', _tps.touchpoint_type,
      'source', _tps.source,
      'medium', _tps.medium,
      'campaign', _tps.campaign,
      'occurred_at', _tps.occurred_at,
      'share', ROUND(_share::numeric, 4),
      'value', ROUND((_share * _deal_value)::numeric, 2)
    );
    _i := _i + 1;
  END LOOP;

  INSERT INTO public.attribution_models_cache (user_id, deal_id, model, allocations, total_value)
  VALUES (auth.uid(), _deal_id, _model, _arr, _deal_value)
  ON CONFLICT (user_id, deal_id, model) DO UPDATE
    SET allocations = EXCLUDED.allocations,
        total_value = EXCLUDED.total_value,
        computed_at = now();

  RETURN jsonb_build_object('model', _model, 'allocations', _arr, 'total_value', _deal_value, 'touchpoints_count', _total);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.compute_revops_kpis(_user_id uuid, _period_start date, _period_end date)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _mql_count INT := 0;
  _sql_count INT := 0;
  _opp_count INT := 0;
  _won_count INT := 0;
  _lost_count INT := 0;
  _won_value NUMERIC := 0;
  _open_pipeline NUMERIC := 0;
  _quota NUMERIC := 0;
  _avg_cycle NUMERIC := 0;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COUNT(*) INTO _mql_count
  FROM public.mql_classifications
  WHERE user_id = _user_id
    AND status = 'mql'
    AND created_at::date BETWEEN _period_start AND _period_end;

  SELECT COUNT(*) INTO _sql_count
  FROM public.mql_classifications
  WHERE user_id = _user_id
    AND status = 'sql'
    AND created_at::date BETWEEN _period_start AND _period_end;

  -- Opportunities (deal_forecasts as proxy)
  SELECT COUNT(*) INTO _opp_count
  FROM public.deal_forecasts
  WHERE user_id = _user_id
    AND created_at::date BETWEEN _period_start AND _period_end;

  -- Won deals via forecast_periods (actual_won_amount) when present
  SELECT COALESCE(SUM(actual_won_amount), 0), COALESCE(SUM(quota_amount), 0)
  INTO _won_value, _quota
  FROM public.forecast_periods
  WHERE user_id = _user_id
    AND period_start >= _period_start
    AND period_end <= _period_end;

  SELECT COALESCE(SUM(amount), 0)
  INTO _open_pipeline
  FROM public.deal_forecasts
  WHERE user_id = _user_id
    AND category IN ('commit','best_case','pipeline');

  -- Won/lost counts via audit if available
  SELECT COUNT(*) INTO _won_count
  FROM public.audit_log
  WHERE user_id = _user_id
    AND entity_type = 'deal_forecasts'
    AND (new_data->>'category') = 'won'
    AND created_at::date BETWEEN _period_start AND _period_end;

  SELECT COUNT(*) INTO _lost_count
  FROM public.audit_log
  WHERE user_id = _user_id
    AND entity_type = 'deal_forecasts'
    AND (new_data->>'category') = 'lost'
    AND created_at::date BETWEEN _period_start AND _period_end;

  RETURN jsonb_build_object(
    'mql_count', _mql_count,
    'sql_count', _sql_count,
    'opp_count', _opp_count,
    'won_count', _won_count,
    'lost_count', _lost_count,
    'won_value', _won_value,
    'open_pipeline', _open_pipeline,
    'quota', _quota,
    'mql_to_sql_rate', CASE WHEN _mql_count > 0 THEN ROUND((_sql_count::numeric / _mql_count) * 100, 2) ELSE 0 END,
    'sql_to_opp_rate', CASE WHEN _sql_count > 0 THEN ROUND((_opp_count::numeric / _sql_count) * 100, 2) ELSE 0 END,
    'sql_to_won_rate', CASE WHEN _sql_count > 0 THEN ROUND((_won_count::numeric / _sql_count) * 100, 2) ELSE 0 END,
    'win_rate', CASE WHEN (_won_count + _lost_count) > 0 THEN ROUND((_won_count::numeric / (_won_count + _lost_count)) * 100, 2) ELSE 0 END,
    'pipeline_coverage', CASE WHEN _quota > 0 THEN ROUND((_open_pipeline / _quota), 2) ELSE 0 END,
    'quota_attainment', CASE WHEN _quota > 0 THEN ROUND((_won_value / _quota) * 100, 2) ELSE 0 END,
    'avg_cycle_days', _avg_cycle,
    'period_start', _period_start,
    'period_end', _period_end
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.connection_configs_encrypt_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  sensitive_keys text[] := ARRAY['token','api_key','apiKey','secret','password','service_role_key','webhook_secret'];
  k text;
  combined jsonb;
BEGIN
  -- Mescla config + secret_refs para cifrar tudo junto
  combined := COALESCE(NEW.config, '{}'::jsonb) || COALESCE(NEW.secret_refs, '{}'::jsonb);
  IF combined <> '{}'::jsonb THEN
    NEW.encrypted_config := pgp_sym_encrypt(combined::text, public._connection_encryption_key());
  END IF;

  -- Remove valores sensíveis da coluna `config` em texto puro (mantém estrutura/keys vazias)
  IF NEW.config IS NOT NULL THEN
    FOREACH k IN ARRAY sensitive_keys LOOP
      IF NEW.config ? k THEN
        NEW.config := jsonb_set(NEW.config, ARRAY[k], '"***"'::jsonb, false);
      END IF;
    END LOOP;
  END IF;

  -- Limpa secret_refs (não persiste em texto puro)
  NEW.secret_refs := '{}'::jsonb;
  NEW.encryption_version := 1;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.cs_renewal_pipeline(_user_id uuid, _days_ahead integer DEFAULT 90)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _result JSONB;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'total_count', COUNT(*),
    'total_arr', COALESCE(SUM(r.forecasted_arr), 0),
    'at_risk_count', COUNT(*) FILTER (WHERE r.risk_level IN ('high','critical')),
    'at_risk_arr', COALESCE(SUM(r.forecasted_arr) FILTER (WHERE r.risk_level IN ('high','critical')), 0),
    'renewals', COALESCE(jsonb_agg(jsonb_build_object(
      'id', r.id,
      'account_id', r.account_id,
      'account_name', a.account_name,
      'tier', a.tier,
      'health_score', a.health_score,
      'renewal_date', r.renewal_date,
      'days_until', (r.renewal_date - CURRENT_DATE),
      'status', r.status,
      'forecasted_arr', r.forecasted_arr,
      'risk_level', r.risk_level
    ) ORDER BY r.renewal_date ASC), '[]'::jsonb)
  ) INTO _result
  FROM public.cs_renewals r
  JOIN public.cs_accounts a ON a.id = r.account_id
  WHERE r.user_id = _user_id
    AND r.status IN ('upcoming','in_negotiation')
    AND r.renewal_date BETWEEN CURRENT_DATE AND CURRENT_DATE + (_days_ahead || ' days')::INTERVAL;

  RETURN _result;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.decrypt_connection_config(p_encrypted bytea)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  plain text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem descriptografar configurações';
  END IF;
  IF p_encrypted IS NULL THEN RETURN NULL; END IF;
  plain := pgp_sym_decrypt(p_encrypted, public._connection_encryption_key());
  RETURN plain::jsonb;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.detect_contact_intel_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- title_change
  IF NEW.role_title IS DISTINCT FROM OLD.role_title 
     AND COALESCE(trim(NEW.role_title), '') <> '' THEN
    INSERT INTO public.people_intelligence_events
      (user_id, contact_id, event_type, field_name, old_value, new_value, source, metadata)
    VALUES (
      NEW.user_id, NEW.id,
      CASE WHEN OLD.company_id IS NOT DISTINCT FROM NEW.company_id THEN 'promotion' ELSE 'title_change' END,
      'role_title',
      OLD.role_title, NEW.role_title,
      'contacts_trigger',
      jsonb_build_object('company_id', NEW.company_id)
    );
  END IF;

  -- company_change
  IF NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    INSERT INTO public.people_intelligence_events
      (user_id, contact_id, event_type, field_name, old_value, new_value, source, metadata)
    VALUES (
      NEW.user_id, NEW.id, 'company_change', 'company_id',
      OLD.company_id::text, NEW.company_id::text,
      'contacts_trigger',
      jsonb_build_object('role_title', NEW.role_title)
    );
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.dismiss_revops_alert(_alert_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.revops_alerts
  SET dismissed = true
  WHERE id = _alert_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.encrypt_connection_config(p_config jsonb)
 RETURNS bytea
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem cifrar configurações';
  END IF;
  RETURN pgp_sym_encrypt(p_config::text, public._connection_encryption_key());
END;
$function$
;
CREATE OR REPLACE FUNCTION public.enqueue_behavioral_profile_regen()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact_id UUID;
  v_user_id UUID;
  v_source TEXT := TG_TABLE_NAME;
BEGIN
  v_contact_id := NEW.contact_id;
  IF v_contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user_id FROM public.contacts WHERE id = v_contact_id;
  IF v_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.behavioral_profile_regen_queue (contact_id, user_id, next_run_at, trigger_source, enqueued_at, updated_at)
  VALUES (v_contact_id, v_user_id, now() + INTERVAL '5 minutes', v_source, now(), now())
  ON CONFLICT (contact_id) DO UPDATE
    SET next_run_at = GREATEST(behavioral_profile_regen_queue.next_run_at, now() + INTERVAL '5 minutes'),
        trigger_source = EXCLUDED.trigger_source,
        updated_at = now(),
        attempts = 0,
        last_error = NULL;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.enqueue_contact_validation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Email
  IF NEW.email IS NOT NULL AND length(trim(NEW.email)) > 3 THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.email IS DISTINCT FROM OLD.email) THEN
      INSERT INTO public.validation_queue (user_id, contact_id, kind, value)
      VALUES (NEW.user_id, NEW.id, 'email', NEW.email);
    END IF;
  END IF;

  -- Phone
  IF NEW.phone IS NOT NULL AND length(trim(NEW.phone)) >= 5 THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.phone IS DISTINCT FROM OLD.phone) THEN
      INSERT INTO public.validation_queue (user_id, contact_id, kind, value)
      VALUES (NEW.user_id, NEW.id, 'phone', NEW.phone);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.enqueue_crm_reprocess()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.status = 'error' THEN
        INSERT INTO public.crm_automation_reprocess_queue (log_id, next_retry_at)
        VALUES (NEW.id, now() + interval '5 minutes');
    END IF;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.enqueue_smart_notification(_event_type text, _title text, _body text DEFAULT NULL::text, _entity_type text DEFAULT NULL::text, _entity_id text DEFAULT NULL::text, _urgency text DEFAULT 'normal'::text, _bundle_key text DEFAULT NULL::text, _action_url text DEFAULT NULL::text, _payload jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _existing UUID;
  _new_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF _bundle_key IS NOT NULL THEN
    SELECT id INTO _existing
    FROM public.smart_notifications
    WHERE user_id = auth.uid()
      AND bundle_key = _bundle_key
      AND status IN ('pending','delivered','snoozed')
      AND created_at > now() - INTERVAL '6 hours'
    ORDER BY created_at DESC LIMIT 1;

    IF _existing IS NOT NULL THEN
      UPDATE public.smart_notifications
      SET bundle_count = bundle_count + 1,
          payload = payload || jsonb_build_object('last_bundle_at', now()),
          urgency = CASE
            WHEN _urgency = 'critical' THEN 'critical'
            WHEN urgency = 'critical' THEN 'critical'
            WHEN _urgency = 'high' OR urgency = 'high' THEN 'high'
            ELSE urgency
          END
      WHERE id = _existing;
      RETURN _existing;
    END IF;
  END IF;

  INSERT INTO public.smart_notifications (
    user_id, event_type, entity_type, entity_id, title, body,
    payload, urgency, bundle_key, action_url, decided_channel, decision_reason
  ) VALUES (
    auth.uid(), _event_type, _entity_type, _entity_id, _title, _body,
    COALESCE(_payload, '{}'::jsonb), _urgency, _bundle_key, _action_url,
    'in_app', 'manual_enqueue'
  ) RETURNING id INTO _new_id;

  RETURN _new_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.enroll_contact_in_workflow(_workflow_id uuid, _contact_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _id UUID;
BEGIN
  INSERT INTO public.nurturing_executions (user_id, workflow_id, contact_id, status, next_action_at)
  VALUES (auth.uid(), _workflow_id, _contact_id, 'active', now())
  ON CONFLICT (workflow_id, contact_id) DO UPDATE
    SET status = 'active', next_action_at = COALESCE(public.nurturing_executions.next_action_at, now())
  RETURNING id INTO _id;

  UPDATE public.nurturing_workflows SET enrolled_count = enrolled_count + 1 WHERE id = _workflow_id;

  RETURN _id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.ensure_audit_log_partition(target_date date DEFAULT CURRENT_DATE)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  start_month DATE := date_trunc('month', target_date)::DATE;
  end_month DATE := (date_trunc('month', target_date) + INTERVAL '1 month')::DATE;
  partition_name TEXT := format('audit_log_%s', to_char(start_month, 'YYYY_MM'));
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.audit_log FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_month, end_month
  );
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', partition_name);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.evaluate_mql(_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _criterion RECORD;
  _matched UUID;
  _score INT := 0;
  _classification_id UUID;
  _result JSONB;
BEGIN
  -- Get contact lead score (if exists)
  SELECT COALESCE(lead_score, 0) INTO _score FROM public.contacts WHERE id = _contact_id AND user_id = auth.uid();

  FOR _criterion IN
    SELECT * FROM public.mql_criteria
    WHERE user_id = auth.uid() AND is_active = true
    ORDER BY priority DESC, created_at ASC
  LOOP
    -- Simple evaluation: condition object {min_score:int, required_tags:[]}
    IF (_criterion.conditions->>'min_score')::INT IS NULL OR _score >= (_criterion.conditions->>'min_score')::INT THEN
      _matched := _criterion.id;
      EXIT;
    END IF;
  END LOOP;

  IF _matched IS NULL THEN
    RETURN jsonb_build_object('qualified', false, 'score', _score);
  END IF;

  INSERT INTO public.mql_classifications (user_id, contact_id, criteria_id, status, score_snapshot, reason)
  VALUES (auth.uid(), _contact_id, _matched, 'mql', _score, 'Auto-evaluated')
  ON CONFLICT DO NOTHING
  RETURNING id INTO _classification_id;

  IF _classification_id IS NULL THEN
    SELECT id INTO _classification_id FROM public.mql_classifications
    WHERE user_id = auth.uid() AND contact_id = _contact_id
    ORDER BY created_at DESC LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'qualified', true,
    'score', _score,
    'criteria_id', _matched,
    'classification_id', _classification_id
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.execute_readonly_query(query_text text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  result json;
  upper_query text;
BEGIN
  upper_query := upper(trim(query_text));
  
  -- Only allow SELECT statements
  IF NOT (upper_query LIKE 'SELECT%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Block dangerous keywords
  IF upper_query ~ '(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|EXECUTE|COPY)\s' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;
  
  -- Block access to auth and internal schemas
  IF upper_query ~ '(auth\.|pg_|information_schema|supabase_)' THEN
    RAISE EXCEPTION 'Access to system schemas is not allowed';
  END IF;
  
  EXECUTE 'SELECT coalesce(json_agg(row_to_json(t)), ''[]''::json) FROM (' || query_text || ') t'
    INTO result;
  
  RETURN result;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.fn_validate_deal_stage_transition()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    transition_record RECORD;
BEGIN
    -- Se o estágio não mudou, ok
    IF (OLD.stage_id IS NOT DISTINCT FROM NEW.stage_id) THEN
        RETURN NEW;
    END IF;

    -- Se OLD.stage_id é NULL (novo deal), ok
    IF (OLD.stage_id IS NULL) THEN
        RETURN NEW;
    END IF;

    -- Verificar se existe uma regra explícita para esta transição
    SELECT * INTO transition_record 
    FROM public.pipeline_stage_transitions 
    WHERE pipeline_id = NEW.pipeline_id 
      AND from_stage_id = OLD.stage_id 
      AND to_stage_id = NEW.stage_id;

    -- Se a regra existe e is_allowed é false, bloqueia
    IF FOUND AND transition_record.is_allowed = false THEN
        RAISE EXCEPTION 'Transição de estágio não permitida: de % para %', OLD.stage_id, NEW.stage_id;
    END IF;

    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_behavioral_regen_cron_health()
 RETURNS TABLE(jobname text, schedule text, active boolean, last_run_at timestamp with time zone, last_status text, last_duration_ms integer, runs_24h integer, failures_24h integer, success_rate_pct numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'extensions', 'cron'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  RETURN QUERY
  WITH jobs AS (
    SELECT j.jobid, j.jobname, j.schedule, j.active
    FROM cron.job j
    WHERE j.jobname IN (
      'process-behavioral-regen-queue-5min',
      'cleanup-behavioral-regen-queue-daily'
    )
  ),
  runs AS (
    SELECT
      d.jobid,
      count(*) FILTER (WHERE d.start_time > now() - interval '24 hours') AS runs_24h,
      count(*) FILTER (WHERE d.start_time > now() - interval '24 hours' AND d.status <> 'succeeded') AS fails_24h,
      max(d.start_time) AS last_run,
      (array_agg(d.status ORDER BY d.start_time DESC))[1] AS last_status,
      (array_agg(EXTRACT(EPOCH FROM (d.end_time - d.start_time))*1000 ORDER BY d.start_time DESC))[1]::int AS last_dur_ms
    FROM cron.job_run_details d
    WHERE d.jobid IN (SELECT jobid FROM jobs)
    GROUP BY d.jobid
  )
  SELECT
    j.jobname,
    j.schedule,
    j.active,
    r.last_run,
    r.last_status,
    r.last_dur_ms,
    COALESCE(r.runs_24h, 0)::int,
    COALESCE(r.fails_24h, 0)::int,
    CASE WHEN COALESCE(r.runs_24h,0) = 0 THEN NULL
         ELSE round(100.0 * (r.runs_24h - r.fails_24h)::numeric / r.runs_24h, 1)
    END
  FROM jobs j
  LEFT JOIN runs r ON r.jobid = j.jobid
  ORDER BY j.jobname;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_buyer_document_path(_token text, _document_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _room public.deal_rooms;
  _path TEXT;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN NULL; END IF;

  SELECT file_path INTO _path FROM public.deal_room_documents
  WHERE id = _document_id AND room_id = _room.id;

  RETURN _path;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_connection_metrics(_connection_id uuid)
 RETURNS TABLE(p50 numeric, p95 numeric, p99 numeric, success_rate numeric, total_calls bigint, failures bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(percentile_cont(0.50) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p50,
    COALESCE(percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p95,
    COALESCE(percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms), 0)::NUMERIC AS p99,
    CASE WHEN COUNT(*) = 0 THEN 100::NUMERIC
         ELSE ROUND((COUNT(*) FILTER (WHERE status = 'success')::NUMERIC * 100) / COUNT(*), 2)
    END AS success_rate,
    COUNT(*)::BIGINT AS total_calls,
    COUNT(*) FILTER (WHERE status = 'error')::BIGINT AS failures
  FROM public.connection_test_logs
  WHERE connection_id = _connection_id
    AND created_at >= now() - interval '7 days';
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_contact_behavior_gaps(p_contact_id uuid)
 RETURNS TABLE(category text, field_name text, issue_type text, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY 
    -- DISC Gaps
    SELECT 'DISC'::TEXT, 'Perfil Primário'::TEXT, 'Ausente'::TEXT, 'Alta'::TEXT
    FROM public.contact_behavior WHERE contact_id = p_contact_id AND disc_primary IS NULL
    UNION ALL
    SELECT 'DISC'::TEXT, 'Confiança'::TEXT, 'Baixa/Nula'::TEXT, 'Média'::TEXT
    FROM public.contact_behavior WHERE contact_id = p_contact_id AND (disc_confidence IS NULL OR disc_confidence < 20)
    
    -- Communication Gaps
    UNION ALL
    SELECT 'Comunicação'::TEXT, 'Canal Preferido'::TEXT, 'Ausente'::TEXT, 'Média'::TEXT
    FROM public.contact_behavior WHERE contact_id = p_contact_id AND preferred_channel IS NULL
    
    -- Influence Gaps
    UNION ALL
    SELECT 'Influência'::TEXT, 'Poder de Decisão'::TEXT, 'Ausente'::TEXT, 'Alta'::TEXT
    FROM public.contact_influence WHERE contact_id = p_contact_id AND decision_power IS NULL

    -- Personality Frameworks Gaps
    UNION ALL
    SELECT 'Personalidade'::TEXT, 'Big Five'::TEXT, 'Score Incompleto'::TEXT, 'Média'::TEXT
    FROM public.contact_personality WHERE contact_id = p_contact_id AND (big_five_openness IS NULL OR big_five_conscientiousness IS NULL)
    UNION ALL
    SELECT 'Personalidade'::TEXT, 'MBTI'::TEXT, 'Tipo Ausente'::TEXT, 'Alta'::TEXT
    FROM public.contact_personality WHERE contact_id = p_contact_id AND mbti_type IS NULL
    
    -- Metaprograms Gaps
    UNION ALL
    SELECT 'NLP'::TEXT, 'Metaprogramas'::TEXT, 'Não Mapeado'::TEXT, 'Baixa'::TEXT
    WHERE NOT EXISTS (SELECT 1 FROM public.contact_metaprograms WHERE contact_id = p_contact_id);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_contact_framework_gaps(p_contact_id uuid)
 RETURNS TABLE(category text, field_name text, issue_type text, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY 
    -- Big Five incomplete
    SELECT 'Frameworks'::TEXT, 'Big Five'::TEXT, 'Dados Incompletos'::TEXT, 'Média'::TEXT
    FROM public.contact_personality 
    WHERE contact_id = p_contact_id AND (big_five_openness IS NULL OR big_five_conscientiousness IS NULL OR big_five_extraversion IS NULL OR big_five_agreeableness IS NULL OR big_five_neuroticism IS NULL)
    
    UNION ALL
    -- MBTI missing scores
    SELECT 'Frameworks'::TEXT, 'MBTI Scores'::TEXT, 'Scores Dimensionais Ausentes'::TEXT, 'Média'::TEXT
    FROM public.contact_personality 
    WHERE contact_id = p_contact_id AND mbti_type IS NOT NULL AND (mbti_e_i_score IS NULL OR mbti_s_n_score IS NULL)

    UNION ALL
    -- Enneagram missing wing
    SELECT 'Frameworks'::TEXT, 'Eneagrama'::TEXT, 'Asa não definida'::TEXT, 'Baixa'::TEXT
    FROM public.contact_personality 
    WHERE contact_id = p_contact_id AND enneagram_type IS NOT NULL AND enneagram_wing IS NULL
    
    UNION ALL
    -- Rapport Gaps
    SELECT 'Rapport'::TEXT, 'Canais Sensoriais'::TEXT, 'VAKD não mapeado'::TEXT, 'Média'::TEXT
    WHERE NOT EXISTS (SELECT 1 FROM public.contact_rapport_strategy WHERE contact_id = p_contact_id AND (visual_preference_score IS NOT NULL OR auditory_preference_score IS NOT NULL))
    
    UNION ALL
    -- NLP Gaps
    SELECT 'NLP'::TEXT, 'Ancoragem'::TEXT, 'Sem âncoras emocionais'::TEXT, 'Baixa'::TEXT
    FROM public.contact_rapport_strategy 
    WHERE contact_id = p_contact_id AND (emotional_anchors IS NULL OR array_length(emotional_anchors, 1) = 0);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_contact_life_event_gaps(p_contact_id uuid)
 RETURNS TABLE(category text, field_name text, issue_type text, priority text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY 
    -- Birthday missing
    SELECT 'Eventos'::TEXT, 'Aniversário'::TEXT, 'Não registrado'::TEXT, 'Média'::TEXT
    WHERE NOT EXISTS (SELECT 1 FROM public.life_events WHERE contact_id = p_contact_id AND event_type = 'birthday')
    UNION ALL
    -- No upcoming events in next 90 days
    SELECT 'Relacionamento'::TEXT, 'Frequência de Eventos'::TEXT, 'Sem marcos futuros'::TEXT, 'Baixa'::TEXT
    WHERE NOT EXISTS (SELECT 1 FROM public.life_events WHERE contact_id = p_contact_id AND event_date > now())
    AND EXISTS (SELECT 1 FROM public.contacts WHERE id = p_contact_id);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_deal_room_by_token(_token text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _room public.deal_rooms;
  _result JSONB;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'room', jsonb_build_object(
      'id', _room.id,
      'title', _room.title,
      'description', _room.description,
      'deal_name', _room.deal_name,
      'deal_value', _room.deal_value,
      'status', _room.status,
      'target_close_date', _room.target_close_date,
      'created_at', _room.created_at
    ),
    'milestones', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', m.id, 'title', m.title, 'description', m.description,
        'due_date', m.due_date, 'status', m.status, 'owner_side', m.owner_side,
        'sort_order', m.sort_order, 'completed_at', m.completed_at,
        'completed_by_side', m.completed_by_side
      ) ORDER BY m.sort_order)
      FROM public.deal_room_milestones m WHERE m.room_id = _room.id
    ), '[]'::jsonb),
    'stakeholders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', s.id, 'name', s.name, 'role_title', s.role_title,
        'side', s.side, 'influence', s.influence
      ))
      FROM public.deal_room_stakeholders s WHERE s.room_id = _room.id
    ), '[]'::jsonb),
    'documents', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', d.id, 'title', d.title, 'file_path', d.file_path,
        'file_type', d.file_type, 'file_size', d.file_size,
        'uploaded_by_side', d.uploaded_by_side
      ))
      FROM public.deal_room_documents d WHERE d.room_id = _room.id
    ), '[]'::jsonb),
    'comments', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.id, 'author_side', c.author_side, 'author_label', c.author_label,
        'body', c.body, 'created_at', c.created_at
      ) ORDER BY c.created_at)
      FROM public.deal_room_comments c WHERE c.room_id = _room.id
    ), '[]'::jsonb),
    'activities', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', a.id, 'actor_side', a.actor_side, 'actor_label', a.actor_label,
        'activity_type', a.activity_type, 'payload', a.payload, 'created_at', a.created_at
      ) ORDER BY a.created_at DESC)
      FROM (SELECT * FROM public.deal_room_activities WHERE room_id = _room.id ORDER BY created_at DESC LIMIT 50) a
    ), '[]'::jsonb)
  ) INTO _result;

  RETURN _result;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_marketing_funnel_stats(_user_id uuid, _start_date date, _end_date date)
 RETURNS TABLE(stage text, count bigint, previous_stage_count bigint, conversion_rate numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_views BIGINT;
    v_leads BIGINT;
    v_mqls BIGINT;
    v_sqls BIGINT;
    v_customers BIGINT;
BEGIN
    -- Total Views (Lead Magnets + Landing Pages)
    SELECT COALESCE(SUM(view_count), 0) INTO v_views
    FROM public.lead_magnets WHERE user_id = _user_id;
    
    -- Total Leads (Submissions)
    SELECT COUNT(*) INTO v_leads
    FROM public.form_submissions s
    JOIN public.marketing_forms f ON s.form_id = f.id
    WHERE f.user_id = _user_id AND s.created_at BETWEEN _start_date AND _end_date;
    
    -- MQLs
    SELECT COUNT(*) INTO v_mqls
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'mql' AND qualified_at BETWEEN _start_date AND _end_date;
    
    -- SQLs
    SELECT COUNT(*) INTO v_sqls
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'sql' AND handoff_at BETWEEN _start_date AND _end_date;
    
    -- Customers
    SELECT COUNT(*) INTO v_customers
    FROM public.mql_classifications
    WHERE user_id = _user_id AND status = 'customer' AND handoff_at BETWEEN _start_date AND _end_date;

    -- Return Views
    stage := 'Visualizações'; count := v_views; previous_stage_count := v_views; conversion_rate := 100;
    RETURN NEXT;
    
    -- Return Leads
    stage := 'Leads'; count := v_leads; previous_stage_count := v_views; 
    conversion_rate := CASE WHEN v_views > 0 THEN (v_leads::DECIMAL / v_views) * 100 ELSE 0 END;
    RETURN NEXT;
    
    -- Return MQLs
    stage := 'MQLs'; count := v_mqls; previous_stage_count := v_leads; 
    conversion_rate := CASE WHEN v_leads > 0 THEN (v_mqls::DECIMAL / v_leads) * 100 ELSE 0 END;
    RETURN NEXT;
    
    -- Return SQLs
    stage := 'SQLs'; count := v_sqls; previous_stage_count := v_mqls; 
    conversion_rate := CASE WHEN v_mqls > 0 THEN (v_sqls::DECIMAL / v_mqls) * 100 ELSE 0 END;
    RETURN NEXT;
    
    -- Return Customers
    stage := 'Clientes'; count := v_customers; previous_stage_count := v_sqls; 
    conversion_rate := CASE WHEN v_sqls > 0 THEN (v_customers::DECIMAL / v_sqls) * 100 ELSE 0 END;
    RETURN NEXT;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_score_explicability(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_contact RECORD;
    v_interactions_count INTEGER;
    v_last_date TIMESTAMP WITH TIME ZONE;
    v_avg_sentiment FLOAT;
    v_days_since_last INTEGER;
    v_factors JSONB;
BEGIN
    SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;
    
    SELECT count(*), max(created_at) INTO v_interactions_count, v_last_date
    FROM public.interactions WHERE contact_id = p_contact_id;
    
    v_days_since_last := EXTRACT(DAY FROM (now() - v_last_date));

    SELECT AVG(CASE WHEN sentiment = 'positive' THEN 100 WHEN sentiment = 'negative' THEN 0 ELSE 50 END)
    INTO v_avg_sentiment FROM public.interactions WHERE contact_id = p_contact_id;

    v_factors := jsonb_build_object(
        'volume', jsonb_build_object('value', v_interactions_count, 'impact', LEAST(v_interactions_count * 10, 100) * 0.4),
        'sentiment', jsonb_build_object('value', COALESCE(v_avg_sentiment, 50), 'impact', COALESCE(v_avg_sentiment, 50) * 0.3),
        'recency', jsonb_build_object('days', v_days_since_last, 'impact', 
            CASE 
                WHEN v_days_since_last <= 7 THEN 30 
                WHEN v_days_since_last <= 30 THEN 15 
                ELSE 0 
            END)
    );

    RETURN jsonb_build_object(
        'current_score', v_contact.relationship_score,
        'stage', v_contact.relationship_stage,
        'factors', v_factors
    );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.get_system_config_num(_key text, _default numeric)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT value FROM public.system_config WHERE key = _key), _default);
$function$
;
CREATE OR REPLACE FUNCTION public.get_team_member_ids(_manager_user_id uuid)
 RETURNS uuid[]
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT array_agg(stm.user_id)
  FROM public.sales_team_members stm
  WHERE stm.manager_id IN (
    SELECT id FROM public.sales_team_members WHERE user_id = _manager_user_id
  )
  OR stm.user_id = _manager_user_id;
$function$
;
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.handle_recurring_life_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- If event is recurring and date has passed, we could optionally move it forward,
    -- but usually for CRM we just need to ensure the next year's reminder works.
    -- This trigger can be expanded for more complex logic.
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$function$
;
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE PARALLEL SAFE STRICT
 SET search_path TO 'public'
AS $function$
  SELECT extensions.unaccent($1);
$function$
;
CREATE OR REPLACE FUNCTION public.increment_contact_version()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.increment_form_view(_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.forms SET view_count = view_count + 1 WHERE slug = _slug AND is_published = true;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.increment_magnet_view(_slug text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE public.lead_magnets SET view_count = view_count + 1 WHERE slug = _slug AND is_published = true;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.increment_playbook_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.playbook_id IS NOT NULL AND NEW.action IN ('opened','used_in_deal') THEN
    UPDATE public.sales_playbooks
    SET usage_count = usage_count + 1
    WHERE id = NEW.playbook_id;
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.increment_version_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.version := COALESCE(OLD.version, 0) + 1;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.increment_webhook_quota(_webhook_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_period date := date_trunc('month', now())::date;
  v_quota public.connection_quotas%ROWTYPE;
BEGIN
  INSERT INTO public.connection_quotas (webhook_id, period_start)
  VALUES (_webhook_id, v_period)
  ON CONFLICT (webhook_id, period_start) DO NOTHING;

  UPDATE public.connection_quotas
  SET calls_used = calls_used + 1,
      updated_at = now()
  WHERE webhook_id = _webhook_id AND period_start = v_period
  RETURNING * INTO v_quota;

  RETURN jsonb_build_object(
    'calls_used', v_quota.calls_used,
    'calls_limit', v_quota.calls_limit,
    'overage_blocked', v_quota.overage_blocked,
    'exceeded', v_quota.calls_used > v_quota.calls_limit
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.log_behavioral_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_user_id UUID;
    v_contact_id UUID;
    v_old_json JSONB := NULL;
    v_new_json JSONB := NULL;
    v_reason TEXT;
BEGIN
    -- Try to get current user ID
    BEGIN
        v_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'DELETE') THEN
        v_contact_id := OLD.contact_id;
        v_old_json := to_jsonb(OLD);
        v_reason := 'Remoção de registro em ' || TG_TABLE_NAME;
    ELSE
        v_contact_id := NEW.contact_id;
        v_new_json := to_jsonb(NEW);
        IF (TG_OP = 'INSERT') THEN
            v_reason := 'Novo registro em ' || TG_TABLE_NAME;
        ELSE
            v_old_json := to_jsonb(OLD);
            v_reason := 'Atualização de registro em ' || TG_TABLE_NAME;
        END IF;
    END IF;

    INSERT INTO public.crm_relationship_audit_logs (
        contact_id,
        user_id,
        change_source,
        field_name,
        old_value,
        new_value,
        reason
    ) VALUES (
        v_contact_id,
        v_user_id,
        'manual',
        TG_TABLE_NAME,
        v_old_json::TEXT,
        v_new_json::TEXT,
        v_reason
    );
    
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.log_contact_relationship_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Log Score Change
    IF (OLD.relationship_score IS DISTINCT FROM NEW.relationship_score) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'score', OLD.relationship_score::text, NEW.relationship_score::text, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Atualização de score detectada');
    END IF;

    -- Log Stage Change
    IF (OLD.relationship_stage IS DISTINCT FROM NEW.relationship_stage) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'stage', OLD.relationship_stage, NEW.relationship_stage, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Mudança de estágio do funil');
    END IF;

    -- Log Sentiment Change
    IF (OLD.sentiment IS DISTINCT FROM NEW.sentiment) THEN
        INSERT INTO public.crm_relationship_audit_logs (user_id, contact_id, field_name, old_value, new_value, change_source, reason)
        VALUES (NEW.user_id, NEW.id, 'sentiment', OLD.sentiment, NEW.sentiment, 
               CASE WHEN NEW.updated_at = OLD.updated_at THEN 'automation' ELSE 'manual' END,
               'Análise de sentimento atualizada');
    END IF;

    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.log_contact_tag_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  changed boolean := false;
begin
  if coalesce(old.hobbies, '{}') is distinct from coalesce(new.hobbies, '{}') then
    changed := true;
  end if;
  if coalesce(old.interests, '{}') is distinct from coalesce(new.interests, '{}') then
    changed := true;
  end if;
  if changed then
    insert into public.audit_log(entity_type, entity_id, action, old_data, new_data, user_id)
    values (
      'contact_tags',
      new.id,
      'update',
      jsonb_build_object(
        'hobbies', to_jsonb(coalesce(old.hobbies, '{}'::text[])),
        'interests', to_jsonb(coalesce(old.interests, '{}'::text[]))
      ),
      jsonb_build_object(
        'hobbies', to_jsonb(coalesce(new.hobbies, '{}'::text[])),
        'interests', to_jsonb(coalesce(new.interests, '{}'::text[]))
      ),
      coalesce(auth.uid(), new.user_id)
    );
  end if;
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.log_deal_forecast_category_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.category IS DISTINCT FROM NEW.category THEN
    INSERT INTO public.forecast_categories_history (user_id, deal_forecast_id, from_category, to_category, changed_by, reason)
    VALUES (NEW.user_id, NEW.id, OLD.category, NEW.category, 'user', NEW.notes);
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.move_deal(p_deal_id uuid, p_new_stage_id uuid, p_new_probability numeric DEFAULT NULL::numeric)
 RETURNS deals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_deal public.deals;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- Verificar existência e posse/acesso
    SELECT * INTO v_deal FROM public.deals WHERE id = p_deal_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal não encontrado';
    END IF;

    -- Validar se o usuário tem permissão (exemplo simples: é o dono ou admin)
    -- Em um sistema real, isso pode ser mais complexo
    IF v_deal.user_id != v_user_id AND NOT public.has_role(v_user_id, 'admin') THEN
        RAISE EXCEPTION 'Sem permissão para mover este negócio';
    END IF;

    -- O trigger tr_validate_deal_stage_transition que criamos anteriormente 
    -- cuidará da validação da regra de negócio (fluxo permitido) durante o UPDATE.

    UPDATE public.deals
    SET 
        stage_id = p_new_stage_id,
        probability = COALESCE(p_new_probability, probability),
        updated_at = now()
    WHERE id = p_deal_id
    RETURNING * INTO v_deal;

    RETURN v_deal;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_old_stage TEXT;
    v_is_allowed BOOLEAN;
BEGIN
    -- Obter estágio atual (checa se deal existe)
    SELECT pipeline_stage INTO v_old_stage FROM public.deals WHERE id = p_deal_id;
    
    IF v_old_stage IS NULL THEN
        RAISE EXCEPTION 'Deal não encontrado: %', p_deal_id;
    END IF;
    
    -- Validar se transição é permitida
    SELECT allowed INTO v_is_allowed 
    FROM public.pipeline_stage_transitions 
    WHERE from_stage = v_old_stage AND to_stage = p_new_stage;
    
    -- Se não existir na tabela, permitimos por padrão (flexibilidade), 
    -- mas se existir e for allowed=false, bloqueamos.
    IF v_is_allowed IS FALSE THEN
        RAISE EXCEPTION 'Transição de % para % não permitida por política de negócio', v_old_stage, p_new_stage;
    END IF;

    -- Update atômico
    UPDATE public.deals
    SET 
        pipeline_stage = p_new_stage,
        probabilidade = COALESCE(p_new_probability, probabilidade),
        updated_at = now()
    WHERE id = p_deal_id;

    -- Registrar auditoria se a tabela existir
    BEGIN
        INSERT INTO public.audit_log (entity_type, entity_id, action, old_data, new_data)
        VALUES ('deal', p_deal_id, 'move_stage', jsonb_build_object('stage', v_old_stage), jsonb_build_object('stage', p_new_stage));
    EXCEPTION WHEN OTHERS THEN
        -- Ignora se audit_log não existir ou falhar
    END;

    RETURN jsonb_build_object('success', true, 'deal_id', p_deal_id, 'from', v_old_stage, 'to', p_new_stage);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability numeric DEFAULT NULL::numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_current_stage TEXT;
    v_is_allowed BOOLEAN;
    v_result JSONB;
BEGIN
    -- 1. Get current state
    SELECT pipeline_stage INTO v_current_stage FROM public.deals WHERE id = p_deal_id;
    
    IF v_current_stage IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Deal not found');
    END IF;

    -- 2. Validate transition
    SELECT is_allowed INTO v_is_allowed 
    FROM public.pipeline_stage_transitions 
    WHERE from_stage = v_current_stage AND to_stage = p_new_stage;

    IF v_is_allowed IS NOT TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', format('Transition from %s to %s is not allowed.', v_current_stage, p_new_stage));
    END IF;

    -- 3. Perform update
    UPDATE public.deals
    SET 
        pipeline_stage = p_new_stage,
        probabilidade = COALESCE(p_new_probability, probabilidade),
        updated_at = now()
    WHERE id = p_deal_id;

    -- 4. Audit entry (only if audit_log exists)
    BEGIN
        INSERT INTO public.audit_log (
            entity_type, 
            entity_id, 
            action, 
            old_data, 
            new_data, 
            user_id
        ) VALUES (
            'deal',
            p_deal_id,
            'move_stage',
            jsonb_build_object('stage', v_current_stage),
            jsonb_build_object('stage', p_new_stage),
            auth.uid()
        );
    EXCEPTION WHEN OTHERS THEN
        -- Fallback if audit_log table doesn't exist or has different schema
        NULL;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'deal_id', p_deal_id,
        'from', v_current_stage,
        'to', p_new_stage
    );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_admins_on_critical_behavioral_alert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_id uuid;
  notif_title text;
BEGIN
  IF NEW.severity <> 'critical' THEN
    RETURN NEW;
  END IF;

  IF NEW.alert_type NOT IN ('behavioral_regen_error_rate', 'behavioral_regen_cron_stale') THEN
    RETURN NEW;
  END IF;

  notif_title := CASE
    WHEN NEW.alert_type = 'behavioral_regen_cron_stale'
      THEN '🚨 Cron de reanálise comportamental travado'
    ELSE '🚨 Taxa de erro crítica na reanálise comportamental'
  END;

  FOR admin_id IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
  LOOP
    INSERT INTO public.smart_notifications (
      user_id, event_type, entity_type, entity_id,
      title, body, payload, urgency, decided_channel,
      decision_reason, status, scheduled_for, action_url
    ) VALUES (
      admin_id,
      'system_alert_critical',
      'system_alert',
      NEW.id::text,
      notif_title,
      NEW.message,
      jsonb_build_object(
        'alert_id', NEW.id,
        'alert_type', NEW.alert_type,
        'severity', NEW.severity,
        'metadata', NEW.metadata
      ),
      'high',
      'in_app',
      'Alerta crítico de infraestrutura',
      'pending',
      now(),
      '/admin/behavioral-regen-audit'
    );
  END LOOP;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_connection_failures()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  recent_failures INT;
  conn_name TEXT;
  owner_id UUID;
BEGIN
  IF NEW.status <> 'error' THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO recent_failures
  FROM (
    SELECT status FROM public.connection_test_logs
    WHERE connection_id = NEW.connection_id
    ORDER BY created_at DESC
    LIMIT 5
  ) recent
  WHERE status = 'error';

  IF recent_failures >= 5 THEN
    SELECT name, created_by INTO conn_name, owner_id
    FROM public.connection_configs WHERE id = NEW.connection_id;

    INSERT INTO public.smart_notifications (
      user_id, event_type, title, body, urgency,
      entity_type, entity_id, decided_channel, payload
    ) VALUES (
      owner_id, 'connection_alert',
      'Conexão "' || COALESCE(conn_name, 'desconhecida') || '" com falhas consecutivas',
      '5 ou mais testes falharam recentemente. Verifique credenciais e endpoint.',
      'high', 'connection', NEW.connection_id, 'in_app',
      jsonb_build_object('reason', 'consecutive_failures', 'count', recent_failures)
    );
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_critical_next_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE _contact_name TEXT;
BEGIN
  IF NEW.urgency <> 'critical' THEN RETURN NEW; END IF;

  SELECT (first_name || ' ' || last_name) INTO _contact_name
  FROM public.contacts WHERE id = NEW.contact_id;

  INSERT INTO public.smart_notifications (
    user_id, event_type, entity_type, entity_id, title, body,
    urgency, bundle_key, decided_channel, decision_reason, action_url, payload
  ) VALUES (
    NEW.user_id,
    'next_action_critical',
    'contact',
    NEW.contact_id::text,
    'Ação urgente: ' || COALESCE(_contact_name, 'contato'),
    NEW.action,
    'critical',
    'next_action:' || NEW.contact_id::text,
    'in_app',
    'auto_trigger_critical_action',
    '/contatos/' || NEW.contact_id::text,
    jsonb_build_object('reason', NEW.reason, 'channel_suggested', NEW.channel)
  )
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_webhook_errors()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  hourly_errors INT;
  wh_name TEXT;
  owner_id UUID;
BEGIN
  IF NEW.status <> 'error' THEN RETURN NEW; END IF;

  SELECT COUNT(*) INTO hourly_errors
  FROM public.incoming_webhook_logs
  WHERE webhook_id = NEW.webhook_id
    AND status = 'error'
    AND created_at >= now() - interval '1 hour';

  IF hourly_errors = 10 THEN
    SELECT name, created_by INTO wh_name, owner_id
    FROM public.incoming_webhooks WHERE id = NEW.webhook_id;

    INSERT INTO public.smart_notifications (
      user_id, event_type, title, body, urgency,
      entity_type, entity_id, decided_channel, payload
    ) VALUES (
      owner_id, 'connection_alert',
      'Webhook "' || COALESCE(wh_name, 'desconhecido') || '" com alta taxa de erro',
      '10+ falhas registradas na última hora.',
      'high', 'webhook', NEW.webhook_id, 'in_app',
      jsonb_build_object('reason', 'webhook_error_burst', 'count_1h', hourly_errors)
    );
  END IF;

  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.process_contact_cadence_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.contact_cadence_audit (cadence_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.contact_cadence_audit (cadence_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.contact_cadence_audit (cadence_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.process_contact_preferences_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.contact_preferences_audit (preference_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.contact_preferences_audit (preference_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.contact_preferences_audit (preference_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.process_contact_relatives_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.contact_relatives_audit (relative_id, contact_id, user_id, change_type, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, 'INSERT', row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.contact_relatives_audit (relative_id, contact_id, user_id, change_type, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.contact_relatives_audit (relative_id, contact_id, user_id, change_type, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, 'DELETE', row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.process_contact_time_analysis_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.contact_time_analysis_audit (analysis_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.contact_time_analysis_audit (analysis_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.contact_time_analysis_audit (analysis_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.process_disc_analysis_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.disc_analysis_history_audit (analysis_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.disc_analysis_history_audit (analysis_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.disc_analysis_history_audit (analysis_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.process_interactions_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.interactions_audit (interaction_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.interactions_audit (interaction_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.interactions_audit (interaction_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.process_reframing_audit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.reframing_analysis_audit (analysis_id, contact_id, user_id, operation, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.reframing_analysis_audit (analysis_id, contact_id, user_id, operation, old_data, new_data)
        VALUES (NEW.id, NEW.contact_id, NEW.user_id, TG_OP, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.reframing_analysis_audit (analysis_id, contact_id, user_id, operation, old_data)
        VALUES (OLD.id, OLD.contact_id, OLD.user_id, TG_OP, row_to_json(OLD)::jsonb);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.publish_mtta_sla_breach_alert(_mtta_minutes integer, _sla_minutes integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NULL;
  END IF;

  -- Auto-ack de breaches anteriores com mais de 24h (rolagem SLO)
  UPDATE public.system_alerts
     SET acknowledged_at = now(),
         acknowledged_by = auth.uid()
   WHERE alert_type = 'mtta_critical_sla_breach'
     AND acknowledged_at IS NULL
     AND created_at < now() - interval '24 hours';

  -- Dedup: já existe breach não reconhecido nas últimas 24h → não duplica
  IF EXISTS (
    SELECT 1 FROM public.system_alerts
     WHERE alert_type = 'mtta_critical_sla_breach'
       AND acknowledged_at IS NULL
       AND created_at >= now() - interval '24 hours'
  ) THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.system_alerts(
    alert_type, severity, threshold_pct, consumed_pct, message, metadata
  )
  VALUES (
    'mtta_critical_sla_breach',
    'warning',
    _sla_minutes,
    _mtta_minutes,
    format('MTTA crítico (%s min) excedeu SLA de %s min', _mtta_minutes, _sla_minutes),
    jsonb_build_object(
      'source', 'behavioral_regen_alerts',
      'metric', 'mtta_critical_minutes',
      'value', _mtta_minutes,
      'sla_minutes', _sla_minutes,
      'auto_ack_after_hours', 24
    )
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.record_buyer_view(_token text, _label text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _room public.deal_rooms;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN false; END IF;

  UPDATE public.deal_rooms
  SET buyer_view_count = buyer_view_count + 1,
      last_buyer_view_at = now()
  WHERE id = _room.id;

  INSERT INTO public.deal_room_activities (room_id, user_id, actor_side, actor_label, activity_type, payload)
  VALUES (_room.id, _room.user_id, 'buyer', COALESCE(_label,'Buyer'), 'view', jsonb_build_object('at', now()));

  RETURN true;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.record_family_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF (OLD.family_info IS DISTINCT FROM NEW.family_info) THEN
            INSERT INTO public.contact_family_history (contact_id, user_id, family_info, changed_at)
            VALUES (NEW.id, NEW.user_id, NEW.family_info, now());
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        IF (NEW.family_info IS NOT NULL) THEN
            INSERT INTO public.contact_family_history (contact_id, user_id, family_info, changed_at)
            VALUES (NEW.id, NEW.user_id, NEW.family_info, now());
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.reset_daily_lead_counts()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  affected integer;
BEGIN
  UPDATE public.sales_team_members
  SET leads_today = 0, leads_today_reset_at = now()
  WHERE leads_today_reset_at IS NULL 
     OR leads_today_reset_at::date < CURRENT_DATE;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.save_contact_family_history()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF (OLD.family_info IS DISTINCT FROM NEW.family_info) THEN
    INSERT INTO public.contact_family_history (contact_id, family_info, changed_by)
    VALUES (NEW.id, OLD.family_info, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.search_companies_semantic(p_user_id uuid, p_query text, p_limit integer DEFAULT 10, p_min_similarity real DEFAULT 0.15)
 RETURNS TABLE(id uuid, name text, industry text, city text, state text, similarity real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS qn)
  SELECT
    c.id, c.name, c.industry, c.city, c.state,
    GREATEST(
      similarity(public.immutable_unaccent(lower(c.name)), q.qn),
      similarity(public.immutable_unaccent(lower(COALESCE(c.nome_fantasia, ''))), q.qn) * 0.9,
      similarity(public.immutable_unaccent(lower(COALESCE(c.razao_social, ''))), q.qn) * 0.85,
      similarity(public.immutable_unaccent(lower(COALESCE(c.industry, ''))), q.qn) * 0.5,
      similarity(public.immutable_unaccent(lower(COALESCE(c.notes, ''))), q.qn) * 0.4
    )::real AS similarity
  FROM public.companies c, q
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.name)) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.nome_fantasia, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.razao_social, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.industry, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.notes, ''))) ILIKE '%' || q.qn || '%'
    )
  ORDER BY similarity DESC
  LIMIT p_limit;
$function$
;
CREATE OR REPLACE FUNCTION public.search_companies_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, name text, industry text, city text, state text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT c.id, c.name, c.industry, c.city, c.state
  FROM public.companies c
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.industry, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.city, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  LIMIT p_limit;
$function$
;
CREATE OR REPLACE FUNCTION public.search_contacts_by_nlp(p_user_id uuid, p_vak_primary text DEFAULT NULL::text, p_metaprogram_motivation text DEFAULT NULL::text, p_working_style text DEFAULT NULL::text)
 RETURNS SETOF vw_contacts_nlp
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN QUERY
    SELECT v.*
    FROM public.vw_contacts_nlp v
    WHERE 
        v.user_id = p_user_id
        AND (p_vak_primary IS NULL OR v.vak_dominant = p_vak_primary)
        AND (p_metaprogram_motivation IS NULL OR v.motivation_direction = p_metaprogram_motivation)
        AND (p_working_style IS NULL OR v.working_style = p_working_style);
END;
$function$
;
CREATE OR REPLACE FUNCTION public.search_contacts_semantic(p_user_id uuid, p_query text, p_limit integer DEFAULT 10, p_min_similarity real DEFAULT 0.15)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, role_title text, company_id uuid, similarity real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS qn)
  SELECT
    c.id, c.first_name, c.last_name, c.email, c.phone, c.role_title, c.company_id,
    GREATEST(
      similarity(public.immutable_unaccent(lower(c.first_name || ' ' || c.last_name)), q.qn),
      similarity(public.immutable_unaccent(lower(COALESCE(c.email, ''))), q.qn) * 0.85,
      similarity(public.immutable_unaccent(lower(COALESCE(c.role_title, ''))), q.qn) * 0.6,
      similarity(public.immutable_unaccent(lower(COALESCE(c.notes, ''))), q.qn) * 0.4
    )::real AS similarity
  FROM public.contacts c, q
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.first_name || ' ' || c.last_name)) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.email, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.role_title, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(c.notes, ''))) ILIKE '%' || q.qn || '%'
    )
  ORDER BY similarity DESC
  LIMIT p_limit;
$function$
;
CREATE OR REPLACE FUNCTION public.search_contacts_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, first_name text, last_name text, email text, phone text, role_title text, company_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT c.id, c.first_name, c.last_name, c.email, c.phone, c.role_title, c.company_id
  FROM public.contacts c
  WHERE c.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(c.first_name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(c.last_name)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.email, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(c.role_title, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  LIMIT p_limit;
$function$
;
CREATE OR REPLACE FUNCTION public.search_interactions_semantic(p_user_id uuid, p_query text, p_limit integer DEFAULT 10, p_min_similarity real DEFAULT 0.12)
 RETURNS TABLE(id uuid, title text, type text, created_at timestamp with time zone, contact_id uuid, similarity real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH q AS (SELECT public.immutable_unaccent(lower(p_query)) AS qn)
  SELECT
    i.id, i.title, i.type, i.created_at, i.contact_id,
    GREATEST(
      similarity(public.immutable_unaccent(lower(COALESCE(i.title, ''))), q.qn),
      similarity(public.immutable_unaccent(lower(COALESCE(i.content, ''))), q.qn) * 0.7,
      similarity(public.immutable_unaccent(lower(COALESCE(i.type, ''))), q.qn) * 0.4
    )::real AS similarity
  FROM public.interactions i, q
  WHERE i.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(COALESCE(i.title, ''))) % q.qn
      OR public.immutable_unaccent(lower(COALESCE(i.content, ''))) ILIKE '%' || q.qn || '%'
      OR public.immutable_unaccent(lower(COALESCE(i.type, ''))) % q.qn
    )
  ORDER BY similarity DESC, i.created_at DESC
  LIMIT p_limit;
$function$
;
CREATE OR REPLACE FUNCTION public.search_interactions_unaccent(p_user_id uuid, p_query text, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, title text, type text, created_at timestamp with time zone, contact_id uuid)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT i.id, i.title, i.type, i.created_at, i.contact_id
  FROM public.interactions i
  WHERE i.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(i.title)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      OR public.immutable_unaccent(lower(COALESCE(i.content, ''))) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
    )
  ORDER BY i.created_at DESC
  LIMIT p_limit;
$function$
;
CREATE OR REPLACE FUNCTION public.search_products_semantic(p_user_id uuid, p_query text, p_limit integer DEFAULT 20, p_min_similarity real DEFAULT 0.1)
 RETURNS TABLE(id uuid, external_id text, name text, description text, category text, tags text[], image_url text, price numeric, metadata jsonb, similarity real)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT
    p.id,
    p.external_id,
    p.name,
    p.description,
    p.category,
    p.tags,
    p.image_url,
    p.price,
    p.metadata,
    GREATEST(
      similarity(public.immutable_unaccent(lower(p.name)), public.immutable_unaccent(lower(p_query))),
      similarity(public.immutable_unaccent(lower(COALESCE(p.description, ''))), public.immutable_unaccent(lower(p_query))) * 0.7,
      similarity(public.immutable_unaccent(lower(COALESCE(p.category, ''))), public.immutable_unaccent(lower(p_query))) * 0.5
    )::real AS similarity
  FROM public.search_products_cache p
  WHERE p.user_id = p_user_id
    AND (
      public.immutable_unaccent(lower(p.name)) % public.immutable_unaccent(lower(p_query))
      OR public.immutable_unaccent(lower(COALESCE(p.description, ''))) % public.immutable_unaccent(lower(p_query))
      OR public.immutable_unaccent(lower(COALESCE(p.category, ''))) % public.immutable_unaccent(lower(p_query))
      OR EXISTS (
        SELECT 1 FROM unnest(COALESCE(p.tags, ARRAY[]::text[])) t
        WHERE public.immutable_unaccent(lower(t)) ILIKE '%' || public.immutable_unaccent(lower(p_query)) || '%'
      )
    )
  ORDER BY similarity DESC
  LIMIT p_limit;
$function$
;
CREATE OR REPLACE FUNCTION public.seed_conversation_topics(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.conversation_topics_catalog (user_id, topic_key, label, category, keywords, sort_order) VALUES
    (_user_id, 'pricing_discussion', 'Discussão de Preço', 'pricing', ARRAY['preço','valor','custo','investimento','desconto','orçamento'], 1),
    (_user_id, 'roi_value', 'ROI / Valor', 'pricing', ARRAY['roi','retorno','payback','economia','benefício'], 2),
    (_user_id, 'competitor_mention', 'Menção a Concorrente', 'competition', ARRAY['concorrente','competidor','outra opção','comparar','versus'], 3),
    (_user_id, 'product_features', 'Funcionalidades do Produto', 'product', ARRAY['funcionalidade','feature','recurso','como funciona','demo'], 4),
    (_user_id, 'integration_concerns', 'Preocupações de Integração', 'product', ARRAY['integração','integrar','api','sistema atual','migração'], 5),
    (_user_id, 'timing_urgency', 'Timing e Urgência', 'discovery', ARRAY['quando','prazo','urgente','data','cronograma'], 6),
    (_user_id, 'budget_authority', 'Budget e Autoridade', 'discovery', ARRAY['budget','aprovação','decisor','quem decide','board'], 7),
    (_user_id, 'pain_points', 'Dores e Problemas', 'discovery', ARRAY['problema','dor','desafio','dificuldade','frustração'], 8),
    (_user_id, 'objection_price', 'Objeção: Preço Alto', 'objection', ARRAY['caro','alto','não cabe','muito dinheiro'], 9),
    (_user_id, 'objection_timing', 'Objeção: Não é o Momento', 'objection', ARRAY['agora não','depois','outro momento','adiar'], 10),
    (_user_id, 'next_steps', 'Próximos Passos', 'closing', ARRAY['próximo passo','enviar proposta','agendar','follow up'], 11),
    (_user_id, 'commitment_close', 'Pedido de Compromisso', 'closing', ARRAY['fechamos','vamos seguir','assinar','contrato'], 12)
  ON CONFLICT (user_id, topic_key) DO NOTHING;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.seed_deal_room(_user_id uuid, _deal_id text, _deal_name text, _company_id uuid, _title text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _id UUID;
BEGIN
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT id INTO _id FROM public.deal_rooms
  WHERE user_id = _user_id AND deal_id = _deal_id LIMIT 1;

  IF _id IS NOT NULL THEN
    RETURN _id;
  END IF;

  INSERT INTO public.deal_rooms (user_id, deal_id, deal_name, company_id, title)
  VALUES (_user_id, _deal_id, _deal_name, _company_id, COALESCE(_title, _deal_name, 'Deal Room'))
  RETURNING id INTO _id;

  RETURN _id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.seed_forecast_period(_user_id uuid, _type text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _start DATE;
  _end DATE;
  _id UUID;
  _quota NUMERIC := 0;
BEGIN
  IF _type = 'month' THEN
    _start := date_trunc('month', CURRENT_DATE)::DATE;
    _end := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::DATE;
    SELECT default_monthly_quota INTO _quota FROM public.forecast_quota_settings WHERE user_id = _user_id;
  ELSIF _type = 'quarter' THEN
    _start := date_trunc('quarter', CURRENT_DATE)::DATE;
    _end := (date_trunc('quarter', CURRENT_DATE) + INTERVAL '3 months - 1 day')::DATE;
    SELECT default_quarterly_quota INTO _quota FROM public.forecast_quota_settings WHERE user_id = _user_id;
  ELSE
    RAISE EXCEPTION 'Invalid period_type: %', _type;
  END IF;

  INSERT INTO public.forecast_periods (user_id, period_type, period_start, period_end, quota_amount)
  VALUES (_user_id, _type, _start, _end, COALESCE(_quota, 0))
  ON CONFLICT (user_id, period_type, period_start) DO UPDATE SET updated_at = now()
  RETURNING id INTO _id;

  RETURN _id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.seed_lead_score_defaults(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.lead_score_thresholds (user_id, grade, min_score) VALUES
    (_user_id, 'A', 80),
    (_user_id, 'B', 60),
    (_user_id, 'C', 40),
    (_user_id, 'D', 0)
  ON CONFLICT (user_id, grade) DO NOTHING;

  INSERT INTO public.lead_score_rules (user_id, dimension, signal_key, weight, decay_days) VALUES
    (_user_id, 'fit', 'company_present', 10, 365),
    (_user_id, 'fit', 'role_present', 8, 365),
    (_user_id, 'fit', 'email_present', 5, 365),
    (_user_id, 'fit', 'phone_present', 5, 365),
    (_user_id, 'engagement', 'interaction', 3, 30),
    (_user_id, 'engagement', 'recent_interaction_7d', 10, 14),
    (_user_id, 'engagement', 'email_open', 2, 14),
    (_user_id, 'engagement', 'email_click', 5, 14),
    (_user_id, 'engagement', 'email_reply', 12, 30),
    (_user_id, 'engagement', 'sequence_completed', 8, 30),
    (_user_id, 'intent', 'page_view', 2, 14),
    (_user_id, 'intent', 'pricing_view', 8, 14),
    (_user_id, 'intent', 'demo_request', 15, 30),
    (_user_id, 'intent', 'form_submit', 10, 21),
    (_user_id, 'intent', 'email_click', 4, 14),
    (_user_id, 'intent', 'content_download', 6, 21),
    (_user_id, 'relationship', 'relationship_score', 1, 60)
  ON CONFLICT (user_id, dimension, signal_key) DO NOTHING;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.seed_playbook_defaults(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Discovery playbook
  INSERT INTO public.sales_playbooks (user_id, name, description, scenario, stage_target, content, tags)
  VALUES (
    _user_id,
    'Discovery Inicial — SPIN',
    'Roteiro estruturado para primeira conversa de descoberta usando framework SPIN (Situation, Problem, Implication, Need-payoff).',
    'discovery',
    'qualified',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Abertura (2 min)',
        'type', 'talktrack',
        'body', 'Agradeça o tempo, confirme duração da call, defina objetivo conjunto: "Hoje eu queria entender melhor seu cenário atual e ver se faz sentido conversarmos sobre uma solução. Pode ser?"',
        'items', jsonb_build_array()
      ),
      jsonb_build_object(
        'title', 'Situação',
        'type', 'questions',
        'body', 'Entenda o contexto sem julgar.',
        'items', jsonb_build_array(
          'Como vocês fazem isso hoje?',
          'Quem faz parte do processo?',
          'Há quanto tempo está dessa forma?',
          'Qual ferramenta/processo atual?'
        )
      ),
      jsonb_build_object(
        'title', 'Problema',
        'type', 'questions',
        'body', 'Identifique dores reais.',
        'items', jsonb_build_array(
          'O que mais te incomoda no processo atual?',
          'Onde vocês perdem tempo?',
          'O que falta ter visibilidade?',
          'Quando foi a última vez que isso causou um problema concreto?'
        )
      ),
      jsonb_build_object(
        'title', 'Implicação',
        'type', 'questions',
        'body', 'Amplifique o custo da inação.',
        'items', jsonb_build_array(
          'Se isso continuar, qual o impacto no próximo trimestre?',
          'Quanto isso custa por mês em horas/dinheiro?',
          'Como isso afeta seu time e clientes?'
        )
      ),
      jsonb_build_object(
        'title', 'Need-payoff',
        'type', 'questions',
        'body', 'Faça o cliente verbalizar o valor.',
        'items', jsonb_build_array(
          'Se você resolvesse isso, qual seria o ganho?',
          'Como seria o cenário ideal pra você?',
          'O que mudaria pro seu time?'
        )
      ),
      jsonb_build_object(
        'title', 'Próximos Passos',
        'type', 'next_steps',
        'body', 'Sempre saia com data e ação acordadas.',
        'items', jsonb_build_array(
          'Marcar demo personalizada na próxima semana',
          'Confirmar quem mais precisa estar na próxima conversa',
          'Enviar resumo + materiais relevantes em até 24h'
        )
      )
    )),
    ARRAY['discovery','spin','qualificacao']
  );

  -- Demo playbook
  INSERT INTO public.sales_playbooks (user_id, name, description, scenario, stage_target, content, tags)
  VALUES (
    _user_id,
    'Demo Personalizada de Alto Impacto',
    'Estrutura de demo focada em casos do cliente, não em features.',
    'demo',
    'demo',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Pré-Demo (preparação)',
        'type', 'next_steps',
        'body', 'Faça lição de casa antes.',
        'items', jsonb_build_array(
          'Reler notas do discovery',
          'Preparar 2-3 cenários espelhando dores citadas',
          'Confirmar agenda + participantes 24h antes',
          'Testar áudio/vídeo/tela 10 min antes'
        )
      ),
      jsonb_build_object(
        'title', 'Recap & Confirmação (5 min)',
        'type', 'talktrack',
        'body', 'Recapitule o que ouviu no discovery e confirme: "Pelo que entendi, suas 3 prioridades são X, Y, Z. Faz sentido focarmos nisso hoje?"',
        'items', jsonb_build_array()
      ),
      jsonb_build_object(
        'title', 'Demo guiada por dor',
        'type', 'talktrack',
        'body', 'Para cada dor: mostre o problema → mostre a solução → peça reação. Não corra pelas features.',
        'items', jsonb_build_array(
          'Dor 1 → fluxo na ferramenta → "Como isso resolveria seu caso?"',
          'Dor 2 → fluxo → reação',
          'Dor 3 → fluxo → reação'
        )
      ),
      jsonb_build_object(
        'title', 'Perguntas durante a demo',
        'type', 'questions',
        'body', 'Engaje, não monologue.',
        'items', jsonb_build_array(
          'Faz sentido até aqui?',
          'Como vocês fariam isso hoje?',
          'Quem mais usaria essa funcionalidade?'
        )
      ),
      jsonb_build_object(
        'title', 'Fechamento da demo',
        'type', 'next_steps',
        'body', 'Nunca termine sem next step.',
        'items', jsonb_build_array(
          'Resumir benefícios mostrados',
          'Perguntar: "Em uma escala de 0-10, quão alinhado isso está?"',
          'Agendar próxima call (proposta ou aprofundamento técnico)',
          'Enviar gravação + material em 24h'
        )
      )
    )),
    ARRAY['demo','apresentacao']
  );

  -- Objection handling: pricing
  INSERT INTO public.sales_playbooks (user_id, name, description, scenario, content, tags)
  VALUES (
    _user_id,
    'Objeção: "Está caro"',
    'Roteiro para tratar objeção de preço sem dar desconto reflexo.',
    'objection',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Não reaja com desconto',
        'type', 'talktrack',
        'body', 'Antes de qualquer coisa, valide e investigue: "Quando você diz caro, caro comparado a quê?"',
        'items', jsonb_build_array()
      ),
      jsonb_build_object(
        'title', 'Perguntas de diagnóstico',
        'type', 'questions',
        'body', 'Descubra o que está por trás.',
        'items', jsonb_build_array(
          'Caro comparado a qual alternativa?',
          'Vocês têm budget aprovado pra esse tipo de solução?',
          'Qual seria o ROI esperado pra justificar?',
          'O que precisaria estar incluso pra fazer sentido?'
        )
      ),
      jsonb_build_object(
        'title', 'Respostas estruturadas',
        'type', 'objections',
        'body', 'Use a fórmula: validar → reframe → evidência → pergunta.',
        'items', jsonb_build_array(
          '"Entendo. Outros clientes disseram o mesmo no início, mas em 3 meses tiveram ROI de Xx por causa de Y. Pra vocês, qual seria o impacto de resolver isso?"',
          '"O preço reflete o resultado. Se o problema custa R$ X/mês pra vocês, em quanto tempo isso se paga?"',
          '"Posso te mostrar como cliente Z, do mesmo porte, justificou o investimento?"'
        )
      ),
      jsonb_build_object(
        'title', 'Quando faz sentido flexibilizar',
        'type', 'next_steps',
        'body', 'Só negocie troca por troca.',
        'items', jsonb_build_array(
          'Pagamento à vista por desconto pequeno',
          'Contrato anual em vez de mensal',
          'Reduzir escopo (não preço por feature)',
          'Validar com gerência antes de oferecer'
        )
      )
    )),
    ARRAY['objecao','preco','negociacao']
  );

  -- Closing playbook
  INSERT INTO public.sales_playbooks (user_id, name, description, scenario, stage_target, content, tags)
  VALUES (
    _user_id,
    'Fechamento Assumptivo',
    'Como conduzir o fechamento assumindo o sim, com técnicas de closing.',
    'closing',
    'negotiation',
    jsonb_build_object('sections', jsonb_build_array(
      jsonb_build_object(
        'title', 'Sinais de compra',
        'type', 'talktrack',
        'body', 'Reconheça quando o cliente já decidiu.',
        'items', jsonb_build_array(
          'Pergunta sobre implementação ou onboarding',
          'Pergunta sobre treinamento do time',
          'Pergunta sobre faturamento/contrato',
          'Mudança de "se" para "quando"'
        )
      ),
      jsonb_build_object(
        'title', 'Técnicas de fechamento',
        'type', 'objections',
        'body', 'Escolha a técnica certa pro contexto.',
        'items', jsonb_build_array(
          '**Assumptivo**: "Pra começarmos dia 1º, preciso do contrato assinado até sexta. Posso enviar?"',
          '**Alternativo**: "Você prefere começar com o plano Pro ou Enterprise?"',
          '**Urgência real**: "Esse desconto é até sexta porque fechamos lote aqui"',
          '**Resumo de valor**: "Recapitulando o que vamos resolver pra vocês..."'
        )
      ),
      jsonb_build_object(
        'title', 'Tratando hesitação final',
        'type', 'questions',
        'body', 'Descubra o que está bloqueando.',
        'items', jsonb_build_array(
          'O que falta pra você assinar hoje?',
          'Quem mais precisa aprovar?',
          'Qual o pior cenário se vocês não fizerem isso agora?'
        )
      ),
      jsonb_build_object(
        'title', 'Próximos passos pós-sim',
        'type', 'next_steps',
        'body', 'Aja rápido pra evitar buyer remorse.',
        'items', jsonb_build_array(
          'Enviar contrato em até 2h',
          'Agendar kickoff de implementação',
          'Apresentar CSM/onboarding na mesma semana',
          'Pedir referência/case quando aplicável'
        )
      )
    )),
    ARRAY['fechamento','closing','negociacao']
  );

  -- Battle cards example
  INSERT INTO public.battle_cards (
    user_id, competitor_name, summary,
    our_strengths, their_strengths, weaknesses,
    pricing_comparison, win_themes, landmines, proof_points
  )
  VALUES (
    _user_id,
    'Concorrente Genérico A',
    'Player tradicional, foco em grandes contas, processo de venda lento.',
    jsonb_build_array(
      jsonb_build_object('title','Implementação rápida','detail','Onboarding em 2 semanas vs 3+ meses deles'),
      jsonb_build_object('title','Suporte humano','detail','Atendimento dedicado em português 24/7'),
      jsonb_build_object('title','Preço transparente','detail','Sem custos ocultos de implementação')
    ),
    jsonb_build_array(
      jsonb_build_object('title','Marca consolidada','detail','30 anos de mercado'),
      jsonb_build_object('title','Ecossistema amplo','detail','Muitas integrações nativas')
    ),
    jsonb_build_array(
      jsonb_build_object('title','Implementação demorada','detail','Projetos típicos 6+ meses'),
      jsonb_build_object('title','Suporte caro','detail','SLA premium custa 2x'),
      jsonb_build_object('title','UI desatualizada','detail','Reclamações frequentes de UX em reviews')
    ),
    'Eles cobram setup fee de 30-50% do ACV. Nós: zero setup.',
    ARRAY[
      'Velocidade de implementação',
      'Suporte humano em português',
      'Preço transparente sem surpresas',
      'UX moderna que o time adota'
    ],
    ARRAY[
      'Não competir em volume de integrações',
      'Não atacar a marca diretamente',
      'Cuidado: eles têm relacionamento longo com TI legado'
    ],
    jsonb_build_array(
      jsonb_build_object('client','Cliente X','result','Migrou em 3 semanas, ROI em 2 meses'),
      jsonb_build_object('client','Cliente Y','result','Reduziu custo total em 40% vs concorrente A')
    )
  );

  INSERT INTO public.battle_cards (
    user_id, competitor_name, summary,
    our_strengths, their_strengths, weaknesses,
    pricing_comparison, win_themes, landmines, proof_points
  )
  VALUES (
    _user_id,
    'Concorrente Low-Cost B',
    'Solução barata, foco em SMB, pouca profundidade.',
    jsonb_build_array(
      jsonb_build_object('title','Profundidade funcional','detail','Recursos avançados que escalam com a empresa'),
      jsonb_build_object('title','Confiabilidade enterprise','detail','SLA 99.9%, ISO 27001'),
      jsonb_build_object('title','Customer Success','detail','CSM dedicado a partir do plano Pro')
    ),
    jsonb_build_array(
      jsonb_build_object('title','Preço baixo','detail','30-50% mais barato'),
      jsonb_build_object('title','Setup simples','detail','Self-service em minutos')
    ),
    jsonb_build_array(
      jsonb_build_object('title','Limitações em escala','detail','Trava em volumes médios'),
      jsonb_build_object('title','Sem suporte humano','detail','Apenas chat com bot'),
      jsonb_build_object('title','Sem segurança enterprise','detail','Sem SSO, sem auditoria avançada')
    ),
    'Aparentemente mais barato, mas custa caro quando o time cresce e precisa migrar.',
    ARRAY[
      'TCO em 12-24 meses é menor que o deles',
      'Risco zero de migração futura',
      'Segurança e compliance enterprise',
      'Suporte humano quando importa'
    ],
    ARRAY[
      'Não brigar por preço de tabela',
      'Cuidado em prospects muito early-stage'
    ],
    jsonb_build_array(
      jsonb_build_object('client','Cliente Z','result','Migrou do concorrente B após 8 meses por limitações'),
      jsonb_build_object('client','Cliente W','result','Avaliou os dois e escolheu nós pelo TCO de 24m')
    )
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.seed_win_loss_defaults(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  INSERT INTO public.win_loss_reasons (user_id, category, label, outcome_type, sort_order) VALUES
    -- WON
    (_user_id, 'product', 'Melhor adequação técnica', 'won', 1),
    (_user_id, 'relationship', 'Relacionamento forte com decisor', 'won', 2),
    (_user_id, 'price', 'Melhor proposta comercial', 'won', 3),
    (_user_id, 'timing', 'Timing perfeito', 'won', 4),
    (_user_id, 'product', 'Diferencial competitivo claro', 'won', 5),
    (_user_id, 'relationship', 'Confiança no time de vendas', 'won', 6),
    -- LOST
    (_user_id, 'price', 'Preço acima do orçamento', 'lost', 10),
    (_user_id, 'competition', 'Concorrente escolhido', 'lost', 11),
    (_user_id, 'product', 'Faltou funcionalidade crítica', 'lost', 12),
    (_user_id, 'timing', 'Timing ruim / projeto adiado', 'lost', 13),
    (_user_id, 'budget', 'Sem budget aprovado', 'lost', 14),
    (_user_id, 'authority', 'Não falou com decisor real', 'lost', 15),
    (_user_id, 'need', 'Necessidade não confirmada', 'lost', 16),
    (_user_id, 'relationship', 'Relacionamento fraco', 'lost', 17),
    -- BOTH
    (_user_id, 'other', 'Indicação de cliente atual', 'both', 20),
    (_user_id, 'other', 'Inbound qualificado', 'both', 21),
    (_user_id, 'competition', 'Status quo / não fez nada', 'both', 22),
    (_user_id, 'other', 'Outro', 'both', 99)
  ON CONFLICT (user_id, category, label) DO NOTHING;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.sequence_event_to_intent_signal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _signal_type TEXT;
  _weight NUMERIC := 1;
  _contact_id UUID;
  _user_id UUID;
BEGIN
  -- Map event_type to signal_type
  _signal_type := CASE NEW.event_type
    WHEN 'open' THEN 'email_open'
    WHEN 'opened' THEN 'email_open'
    WHEN 'click' THEN 'email_click'
    WHEN 'clicked' THEN 'email_click'
    WHEN 'reply' THEN 'email_reply'
    WHEN 'replied' THEN 'email_reply'
    WHEN 'completed' THEN 'sequence_completed'
    ELSE NULL
  END;

  IF _signal_type IS NULL THEN
    RETURN NEW;
  END IF;

  _weight := CASE _signal_type
    WHEN 'email_reply' THEN 3
    WHEN 'email_click' THEN 2
    WHEN 'sequence_completed' THEN 2
    ELSE 1
  END;

  -- Resolve contact + user via enrollment
  SELECT e.contact_id, e.user_id INTO _contact_id, _user_id
  FROM public.sequence_enrollments e
  WHERE e.id = NEW.enrollment_id
  LIMIT 1;

  IF _contact_id IS NULL OR _user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.intent_signals (user_id, contact_id, signal_type, source, weight, occurred_at, metadata)
  VALUES (_user_id, _contact_id, _signal_type, 'sequence', _weight, COALESCE(NEW.created_at, now()),
          jsonb_build_object('enrollment_id', NEW.enrollment_id, 'event_type', NEW.event_type, 'sequence_event_id', NEW.id));

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fail-safe: nunca quebrar a inserção do evento original
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.sequence_pause_on_interaction_reply()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.type IN ('whatsapp_received', 'email_received', 'sms_received', 'call_received') 
     OR (NEW.initiated_by = 'contact' AND NEW.type IN ('whatsapp', 'email', 'sms', 'call')) THEN
    UPDATE public.sequence_enrollments
    SET 
      replied_at = COALESCE(replied_at, NEW.created_at),
      status = CASE 
        WHEN status = 'active' AND EXISTS(
          SELECT 1 FROM public.sequences s 
          WHERE s.id = sequence_enrollments.sequence_id AND s.pause_on_reply = true
        ) THEN 'replied'
        ELSE status
      END
    WHERE contact_id = NEW.contact_id
      AND user_id = NEW.user_id
      AND status = 'active'
      AND replied_at IS NULL;
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.set_user_ui_preferences_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.simulate_behavioral_regen_alert(_alert_type text DEFAULT 'behavioral_regen_cron_stale'::text, _severity text DEFAULT 'critical'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  IF _alert_type NOT IN ('behavioral_regen_error_rate','behavioral_regen_cron_stale') THEN
    RAISE EXCEPTION 'invalid alert_type';
  END IF;

  IF _severity NOT IN ('warning','critical') THEN
    RAISE EXCEPTION 'invalid severity';
  END IF;

  INSERT INTO public.system_alerts (
    alert_type, severity, threshold_pct, consumed_pct, message, metadata
  ) VALUES (
    _alert_type,
    _severity,
    CASE WHEN _alert_type = 'behavioral_regen_cron_stale' THEN 30 ELSE 20 END,
    CASE WHEN _alert_type = 'behavioral_regen_cron_stale' THEN 999 ELSE 87 END,
    format('[SIMULAÇÃO] %s disparado manualmente por admin', _alert_type),
    jsonb_build_object(
      'simulated', true,
      'jobname', 'process-behavioral-regen-queue-5min',
      'triggered_by', auth.uid()
    )
  ) RETURNING id INTO new_id;

  RETURN new_id;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.submit_public_form(_slug text, _data jsonb, _utms jsonb DEFAULT '{}'::jsonb, _page_url text DEFAULT NULL::text, _user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _form public.forms;
  _submission_id UUID;
  _routed UUID;
  _members JSONB;
  _members_count INT;
  _idx INT;
BEGIN
  SELECT * INTO _form FROM public.forms WHERE slug = _slug AND is_published = true LIMIT 1;
  IF _form.id IS NULL THEN
    RAISE EXCEPTION 'Form not found or not published';
  END IF;

  -- Round-robin routing
  _members := COALESCE(_form.routing_rules->'members', '[]'::jsonb);
  _members_count := jsonb_array_length(_members);
  IF _members_count > 0 THEN
    _idx := (_form.submission_count % _members_count);
    _routed := (_members->>_idx)::uuid;
  END IF;

  INSERT INTO public.form_submissions (
    form_id, user_id, data, routed_to,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    page_url, user_agent
  )
  VALUES (
    _form.id, _form.user_id, _data, _routed,
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    _utms->>'utm_content', _utms->>'utm_term',
    _page_url, _user_agent
  )
  RETURNING id INTO _submission_id;

  UPDATE public.forms
    SET submission_count = submission_count + 1
    WHERE id = _form.id;

  -- Touchpoint
  INSERT INTO public.attribution_touchpoints (
    user_id, contact_id, touchpoint_type, source, medium, campaign, content, term, page_url, metadata
  ) VALUES (
    _form.user_id, NULL, 'form',
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    _utms->>'utm_content', _utms->>'utm_term',
    _page_url,
    jsonb_build_object('form_id', _form.id, 'submission_id', _submission_id, 'form_name', _form.name)
  );

  RETURN jsonb_build_object(
    'submission_id', _submission_id,
    'redirect_url', _form.redirect_url,
    'success_message', _form.success_message,
    'routed_to', _routed
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.sync_contact_last_interaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    -- Update or insert into contact_cadence
    -- We assume the user who created the interaction is the one to follow up
    -- If multiple users follow up, this might need more complex logic, but for now we use the interaction's user_id
    INSERT INTO public.contact_cadence (contact_id, user_id, last_contact_at)
    VALUES (NEW.contact_id, NEW.user_id, NEW.created_at)
    ON CONFLICT (contact_id, user_id) 
    DO UPDATE SET last_contact_at = EXCLUDED.last_contact_at;
    
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.sync_nlp_to_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (TG_TABLE_NAME = 'vak_analysis_history') THEN
        -- Calculate dominant system
        UPDATE public.contacts 
        SET vak_dominant = CASE 
            WHEN NEW.visual_score >= GREATEST(NEW.auditory_score, NEW.kinesthetic_score, NEW.digital_score) THEN 'V'
            WHEN NEW.auditory_score >= GREATEST(NEW.visual_score, NEW.kinesthetic_score, NEW.digital_score) THEN 'A'
            WHEN NEW.kinesthetic_score >= GREATEST(NEW.visual_score, NEW.auditory_score, NEW.digital_score) THEN 'K'
            ELSE 'D'
        END
        WHERE id = NEW.contact_id;
    ELSIF (TG_TABLE_NAME = 'metaprogram_analysis') THEN
        UPDATE public.contacts 
        SET 
            motivation_direction = CASE 
                WHEN NEW.toward_score > NEW.away_from_score THEN 'toward' 
                WHEN NEW.away_from_score > NEW.toward_score THEN 'away_from' 
                ELSE 'balanced' 
            END,
            working_style = CASE 
                WHEN NEW.options_score > NEW.procedures_score THEN 'options' 
                WHEN NEW.procedures_score > NEW.options_score THEN 'procedures' 
                ELSE 'balanced' 
            END
        WHERE id = NEW.contact_id;
    END IF;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END $function$
;
CREATE OR REPLACE FUNCTION public.touch_system_config()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END $function$
;
CREATE OR REPLACE FUNCTION public.track_magnet_download(_slug text, _email text, _name text DEFAULT NULL::text, _utms jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _magnet public.lead_magnets;
  _dl_id UUID;
BEGIN
  SELECT * INTO _magnet FROM public.lead_magnets WHERE slug = _slug AND is_published = true LIMIT 1;
  IF _magnet.id IS NULL THEN
    RAISE EXCEPTION 'Magnet not found';
  END IF;

  INSERT INTO public.lead_magnet_downloads (
    magnet_id, user_id, email, name,
    utm_source, utm_medium, utm_campaign
  ) VALUES (
    _magnet.id, _magnet.user_id, _email, _name,
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign'
  ) RETURNING id INTO _dl_id;

  UPDATE public.lead_magnets SET download_count = download_count + 1 WHERE id = _magnet.id;

  INSERT INTO public.attribution_touchpoints (
    user_id, touchpoint_type, source, medium, campaign, metadata
  ) VALUES (
    _magnet.user_id, 'magnet',
    _utms->>'utm_source', _utms->>'utm_medium', _utms->>'utm_campaign',
    jsonb_build_object('magnet_id', _magnet.id, 'download_id', _dl_id, 'title', _magnet.title, 'email', _email)
  );

  RETURN jsonb_build_object(
    'download_id', _dl_id,
    'file_path', _magnet.file_path,
    'external_url', _magnet.external_url
  );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.trigger_aggregate_nlp_to_company()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    IF (NEW.company_id IS NOT NULL) THEN
        PERFORM public.aggregate_nlp_to_company(NEW.company_id);
    END IF;
    IF (OLD.company_id IS NOT NULL AND OLD.company_id != COALESCE(NEW.company_id, '00000000-0000-0000-0000-000000000000'::UUID)) THEN
        PERFORM public.aggregate_nlp_to_company(OLD.company_id);
    END IF;
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.trigger_lead_score_recompute()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.contact_id IS NOT NULL THEN
    INSERT INTO public.lead_score_recompute_queue (user_id, contact_id, reason)
    SELECT NEW.user_id, NEW.contact_id, 'intent_signal'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.lead_score_recompute_queue
      WHERE user_id = NEW.user_id
        AND contact_id = NEW.contact_id
        AND processed_at IS NULL
    );
  END IF;
  RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.update_bpr_queue_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$
;
CREATE OR REPLACE FUNCTION public.update_contact_relationship_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    last_interaction_date TIMESTAMP WITH TIME ZONE;
    interaction_count INTEGER;
    avg_sentiment TEXT;
    new_score INTEGER;
BEGIN
    -- Obter última interação e contagem
    SELECT MAX(created_at), COUNT(*)
    INTO last_interaction_date, interaction_count
    FROM public.interactions
    WHERE contact_id = NEW.contact_id;

    -- Calcular sentimento médio recente (últimas 5)
    SELECT sentiment 
    INTO avg_sentiment
    FROM (
        SELECT sentiment, COUNT(*) as cnt
        FROM public.interactions
        WHERE contact_id = NEW.contact_id
        AND sentiment IS NOT NULL
        GROUP BY sentiment
        ORDER BY cnt DESC, MAX(created_at) DESC
        LIMIT 1
    ) sub;

    -- Motor de Score Simples (0-100)
    -- Base: 20 pts por estágio avançado, bônus por interações, penalidade por dias sem contato
    new_score := 0;
    
    -- Pontos por Estágio
    CASE 
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'prospect' THEN new_score := 20;
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'qualified_lead' THEN new_score := 40;
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'opportunity' THEN new_score := 60;
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'customer' THEN new_score := 80;
        WHEN (SELECT relationship_stage FROM public.contacts WHERE id = NEW.contact_id) = 'loyal_customer' THEN new_score := 100;
        ELSE new_score := 10;
    END CASE;

    -- Bônus de Atividade (máx +20)
    new_score := new_score + LEAST(interaction_count, 20);

    -- Penalidade por Inatividade
    IF last_interaction_date IS NOT NULL THEN
        new_score := new_score - (EXTRACT(DAY FROM (now() - last_interaction_date))::INTEGER * 2);
    END IF;

    -- Garantir limites
    new_score := GREATEST(0, LEAST(100, new_score));

    -- Atualizar contato
    UPDATE public.contacts
    SET 
        relationship_score = new_score,
        sentiment = COALESCE(avg_sentiment, 'neutral'),
        last_contact_at = last_interaction_date,
        days_without_contact = EXTRACT(DAY FROM (now() - last_interaction_date))::INTEGER,
        interaction_count = interaction_count,
        updated_at = now()
    WHERE id = NEW.contact_id;

    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.update_deal_amount(p_deal_id uuid, p_new_value numeric)
 RETURNS deals
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_deal public.deals;
BEGIN
    -- Validação básica
    IF p_new_value < 0 THEN
        RAISE EXCEPTION 'Valor do negócio não pode ser negativo';
    END IF;

    UPDATE public.deals
    SET 
        value = p_new_value,
        updated_at = now()
    WHERE id = p_deal_id
    AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    RETURNING * INTO v_deal;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deal não encontrado ou sem permissão';
    END IF;

    RETURN v_deal;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.validate_behavioral_consistency(p_contact_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
    v_issues TEXT[] := '{}';
    v_behavior RECORD;
    v_influence RECORD;
BEGIN
    SELECT * INTO v_behavior FROM public.contact_behavior WHERE contact_id = p_contact_id;
    SELECT * INTO v_influence FROM public.contact_influence WHERE contact_id = p_contact_id;

    IF v_behavior.id IS NOT NULL THEN
        IF v_behavior.disc_primary IS NOT NULL AND (v_behavior.disc_confidence IS NULL OR v_behavior.disc_confidence = 0) THEN
            v_issues := array_append(v_issues, 'Perfil DISC definido mas confiança é zero ou nula');
        END IF;
    END IF;

    IF v_influence.id IS NOT NULL THEN
        IF v_influence.decision_power > 8 AND (v_influence.support_level IS NULL) THEN
            v_issues := array_append(v_issues, 'Alto poder de decisão mas nível de suporte não mapeado');
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'contact_id', p_contact_id,
        'is_consistent', array_length(v_issues, 1) IS NULL,
        'issues', v_issues,
        'timestamp', now()
    );
END;
$function$
;
CREATE OR REPLACE FUNCTION public.validate_entity_relationship()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE ok BOOLEAN;
BEGIN
  -- valida FROM
  IF NEW.from_type = 'company' THEN
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = NEW.from_id) INTO ok;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.contacts  WHERE id = NEW.from_id) INTO ok;
  END IF;
  IF NOT ok THEN RAISE EXCEPTION 'from entity % % não existe', NEW.from_type, NEW.from_id; END IF;

  -- valida TO
  IF NEW.to_type = 'company' THEN
    SELECT EXISTS(SELECT 1 FROM public.companies WHERE id = NEW.to_id) INTO ok;
  ELSE
    SELECT EXISTS(SELECT 1 FROM public.contacts  WHERE id = NEW.to_id) INTO ok;
  END IF;
  IF NOT ok THEN RAISE EXCEPTION 'to entity % % não existe', NEW.to_type, NEW.to_id; END IF;

  -- garante único primary por (from, role)
  IF NEW.is_primary THEN
    UPDATE public.entity_relationships
       SET is_primary = false
     WHERE from_type = NEW.from_type
       AND from_id   = NEW.from_id
       AND role      = NEW.role
       AND id <> NEW.id
       AND is_primary = true;
  END IF;

  RETURN NEW;
END $function$
;
