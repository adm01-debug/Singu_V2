DO $dashboard$
DECLARE
  actor_a uuid;
  actor_b uuid;
  company_b uuid;
  contact_a uuid;
  contact_b uuid;
  interaction_a uuid;
  interaction_b uuid;
  alert_a uuid;
  alert_b uuid;
  alert_mixed uuid;
BEGIN
  SELECT id INTO actor_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO actor_b FROM auth.users WHERE id <> actor_a ORDER BY created_at LIMIT 1;
  IF actor_a IS NULL OR actor_b IS NULL THEN RAISE EXCEPTION 'Exige duas contas cadastradas'; END IF;

  INSERT INTO public.companies (nome_crm, user_id)
  VALUES ('Empresa B - prova de dashboard', actor_b) RETURNING id INTO company_b;
  INSERT INTO public.contacts (user_id, first_name, company_id)
  VALUES (actor_a, 'Contato A - prova de dashboard', company_b) RETURNING id INTO contact_a;
  INSERT INTO public.contacts (user_id, first_name, company_id)
  VALUES (actor_b, 'Contato B - prova de dashboard', company_b) RETURNING id INTO contact_b;
  INSERT INTO public.interactions (user_id, contact_id, company_id, channel, direction, follow_up_required, follow_up_date)
  VALUES (actor_a, contact_a, company_b, 'phone', 'outbound', true, CURRENT_DATE)
  RETURNING id INTO interaction_a;
  INSERT INTO public.interactions (user_id, contact_id, company_id, channel, direction, follow_up_required, follow_up_date)
  VALUES (actor_b, contact_b, company_b, 'phone', 'outbound', true, CURRENT_DATE)
  RETURNING id INTO interaction_b;
  INSERT INTO _dormant.inactivity_alerts (contact_id, alert_type, severity, status)
  VALUES (contact_a, 'contact_inactive', 'high', 'active') RETURNING id INTO alert_a;
  INSERT INTO _dormant.inactivity_alerts (contact_id, alert_type, severity, status)
  VALUES (contact_b, 'contact_inactive', 'high', 'active') RETURNING id INTO alert_b;
  INSERT INTO _dormant.inactivity_alerts (contact_id, company_id, alert_type, severity, status)
  VALUES (contact_a, company_b, 'contact_inactive', 'high', 'active') RETURNING id INTO alert_mixed;

  PERFORM set_config('request.jwt.claim.sub', actor_a::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF (SELECT interactions_total FROM public.vw_singu_data_health) IS DISTINCT FROM
    (SELECT count(*) FROM public.interactions WHERE user_id = actor_a)
  THEN RAISE EXCEPTION 'Saúde dos dados inclui interações de outro usuário para A'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.vw_contacts_sem_apelido WHERE contact_id = contact_a AND empresa IS NULL)
    OR EXISTS (SELECT 1 FROM public.vw_contacts_sem_apelido WHERE contact_id = contact_b)
    OR NOT EXISTS (SELECT 1 FROM public.vw_pending_followups WHERE interaction_id = interaction_a AND company_name IS NULL)
    OR EXISTS (SELECT 1 FROM public.vw_pending_followups WHERE interaction_id = interaction_b)
    OR NOT EXISTS (SELECT 1 FROM public.vw_interacoes_sem_apelido WHERE interaction_id = interaction_a AND empresa IS NULL)
    OR EXISTS (SELECT 1 FROM public.vw_interacoes_sem_apelido WHERE interaction_id = interaction_b)
    OR NOT EXISTS (SELECT 1 FROM public.vw_active_alerts WHERE id = alert_a)
    OR EXISTS (SELECT 1 FROM public.vw_active_alerts WHERE id IN (alert_b, alert_mixed))
  THEN RAISE EXCEPTION 'Falha no isolamento de linhas ou joins para A'; END IF;
  BEGIN
    INSERT INTO public.error_logs (message, severity, user_id) VALUES ('prova A para B', 'error', actor_b);
    RAISE EXCEPTION 'Inserção de log com usuário B aceita';
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
  INSERT INTO public.error_logs (message, severity, user_id) VALUES ('prova A', 'error', actor_a);
  EXECUTE 'RESET ROLE';

  PERFORM set_config('request.jwt.claim.sub', actor_b::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF (SELECT interactions_total FROM public.vw_singu_data_health) IS DISTINCT FROM
    (SELECT count(*) FROM public.interactions WHERE user_id = actor_b)
  THEN RAISE EXCEPTION 'Saúde dos dados inclui interações de outro usuário para B'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.vw_contacts_sem_apelido WHERE contact_id = contact_b)
    OR EXISTS (SELECT 1 FROM public.vw_contacts_sem_apelido WHERE contact_id = contact_a)
    OR NOT EXISTS (SELECT 1 FROM public.vw_pending_followups WHERE interaction_id = interaction_b)
    OR EXISTS (SELECT 1 FROM public.vw_pending_followups WHERE interaction_id = interaction_a)
    OR NOT EXISTS (SELECT 1 FROM public.vw_interacoes_sem_apelido WHERE interaction_id = interaction_b)
    OR EXISTS (SELECT 1 FROM public.vw_interacoes_sem_apelido WHERE interaction_id = interaction_a)
    OR NOT EXISTS (SELECT 1 FROM public.vw_active_alerts WHERE id = alert_b)
    OR EXISTS (SELECT 1 FROM public.vw_active_alerts WHERE id IN (alert_a, alert_mixed))
  THEN RAISE EXCEPTION 'Falha no isolamento de linhas ou joins para B'; END IF;
  EXECUTE 'RESET ROLE';

  UPDATE public.contacts SET deleted_at = now() WHERE id = contact_a;
  PERFORM set_config('request.jwt.claim.sub', actor_a::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF EXISTS (SELECT 1 FROM public.vw_contacts_sem_apelido WHERE contact_id = contact_a)
    OR EXISTS (SELECT 1 FROM public.vw_pending_followups WHERE interaction_id = interaction_a)
    OR EXISTS (SELECT 1 FROM public.vw_interacoes_sem_apelido WHERE interaction_id = interaction_a)
    OR EXISTS (SELECT 1 FROM public.vw_active_alerts WHERE id = alert_a)
  THEN RAISE EXCEPTION 'Contato arquivado ainda aparece no dashboard'; END IF;
  EXECUTE 'RESET ROLE';
END $dashboard$;
