-- Migration: fix_secdef_remaining_guards (Wave 163)
-- Final sweep of unguarded SECURITY DEFINER DML functions.
--
-- Issues addressed:
--   A. New helpers: assert_cadence_access, assert_opportunity_access
--   B. DO injection for p_cc_id (cadences) and p_opportunity_id
--   C. Explicit patches: clone_company, clone_workflow_setup, create_economic_group,
--      create_company, onboard_new_company, upsert_company, create_template,
--      create_webhook (no-p_user_id overload), resolve_alerts_batch, record_nps_response
--   D. Service-role lockdown for 21 admin/automation functions

-- ── A. New guard helpers ──────────────────────────────────────────────────────

-- A1. assert_cadence_access — company_cadences.user_id
CREATE OR REPLACE FUNCTION public.assert_cadence_access(p_cc_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND p_cc_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM company_cadences WHERE id = p_cc_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: cadence % does not belong to the current user', p_cc_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_cadence_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_cadence_access(uuid) TO authenticated, service_role;

-- A2. assert_opportunity_access — sales_opportunities.company_id → companies.user_id
CREATE OR REPLACE FUNCTION public.assert_opportunity_access(p_opportunity_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND p_opportunity_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM sales_opportunities so
       JOIN companies c ON so.company_id = c.id
       WHERE so.id = p_opportunity_id AND c.user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: opportunity % does not belong to the current user', p_opportunity_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.assert_opportunity_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assert_opportunity_access(uuid) TO authenticated, service_role;

-- ── B. CRLF-aware DO block: cadence guard (p_cc_id) ──────────────────────────
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_cadence_access(p_cc_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_cc_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_cadence_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 163] No BEGIN in % (cadence); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_cadence_access%' THEN RAISE WARNING '[Wave 163] Guard missing in % (cadence)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 163] EXECUTE failed % (cadence): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 163] assert_cadence_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- ── C. CRLF-aware DO block: opportunity guard (p_opportunity_id) ──────────────
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text := chr(10) || '  PERFORM public.assert_opportunity_access(p_opportunity_id);';
  patched int := 0; skipped int := 0;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND pg_get_function_arguments(p.oid) LIKE '%p_opportunity_id %'
      AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
      AND pg_get_functiondef(p.oid) NOT LIKE '%assert_opportunity_access%'
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
      AND p.proname NOT LIKE 'singu_%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN RAISE WARNING '[Wave 163] No BEGIN in % (opportunity); skipped', r.proname; skipped := skipped+1; CONTINUE; END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%assert_opportunity_access%' THEN RAISE WARNING '[Wave 163] Guard missing in % (opportunity)', r.proname; skipped := skipped+1; CONTINUE; END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN RAISE WARNING '[Wave 163] EXECUTE failed % (opportunity): %', r.proname, SQLERRM; skipped := skipped+1; END;
  END LOOP;
  RAISE NOTICE '[Wave 163] assert_opportunity_access injected into % fns; % skipped', patched, skipped;
END;
$$;

-- ── D. Explicit patches ───────────────────────────────────────────────────────

-- D1. clone_company: assert source ownership + set user_id on new company/contacts
CREATE OR REPLACE FUNCTION public.clone_company(
  p_source_company_id uuid,
  p_new_name text,
  p_clone_contacts boolean DEFAULT false
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  result jsonb;
  new_company_id uuid;
  source_company record;
BEGIN
  PERFORM public.assert_company_access(p_source_company_id);

  SELECT * INTO source_company FROM companies WHERE id = p_source_company_id AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Empresa origem não encontrada');
  END IF;

  INSERT INTO companies (
    nome_crm, razao_social, nome_fantasia, cnpj, email, telefone,
    endereco, cidade, uf, cep, status, user_id
  )
  SELECT
    p_new_name, razao_social, nome_fantasia, NULL, email, telefone,
    endereco, cidade, uf, cep, 'ativo', auth.uid()
  FROM companies WHERE id = p_source_company_id
  RETURNING id INTO new_company_id;

  IF p_clone_contacts THEN
    INSERT INTO contacts (company_id, full_name, email, telefone, cargo, whatsapp, user_id)
    SELECT new_company_id, full_name, email, telefone, cargo, whatsapp, auth.uid()
    FROM contacts WHERE company_id = p_source_company_id AND deleted_at IS NULL;
  END IF;

  SELECT jsonb_build_object(
    'success', true,
    'new_company_id', new_company_id,
    'source_company_id', p_source_company_id,
    'contacts_cloned', p_clone_contacts,
    'message', 'Empresa clonada com sucesso'
  ) INTO result;

  RETURN result;
END;
$$;

-- D2. clone_workflow_setup: assert ownership of both source and target companies
CREATE OR REPLACE FUNCTION public.clone_workflow_setup(
  p_source_company_id uuid,
  p_target_company_id uuid,
  p_include_scheduled boolean DEFAULT false
)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_cloned INT := 0;
BEGIN
  PERFORM public.assert_company_access(p_source_company_id);
  PERFORM public.assert_company_access(p_target_company_id);

  IF p_include_scheduled THEN
    INSERT INTO interactions (
      id, company_id, type, channel, direction, title, status,
      data_agendada, metadata, user_id, created_at
    )
    SELECT
      gen_random_uuid(),
      p_target_company_id,
      type, channel, direction, title, 'agendado',
      data_agendada + INTERVAL '1 day',
      metadata || jsonb_build_object('cloned_from', id),
      user_id, NOW()
    FROM interactions
    WHERE company_id = p_source_company_id
      AND type = 'scheduled_task'
      AND status = 'agendado';

    GET DIAGNOSTICS v_cloned = ROW_COUNT;
  END IF;

  RETURN v_cloned;
END;
$$;

-- D3. create_economic_group: assert ownership of main company
CREATE OR REPLACE FUNCTION public.create_economic_group(
  p_name text,
  p_main_company_id uuid,
  p_description text DEFAULT NULL::text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE v_group_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_main_company_id);

  INSERT INTO economic_groups (name, description, main_company_id, total_companies)
  VALUES (p_name, p_description, p_main_company_id, 1)
  RETURNING id INTO v_group_id;

  INSERT INTO economic_group_members (group_id, company_id, role)
  VALUES (v_group_id, p_main_company_id, 'main');

  RETURN jsonb_build_object('success', true, 'group_id', v_group_id);
END;
$$;

-- D4. create_company: add user_id = auth.uid() so the new company is owned by the caller
CREATE OR REPLACE FUNCTION public.create_company(
  p_nome_crm text,
  p_cnpj text DEFAULT NULL::text,
  p_email text DEFAULT NULL::text,
  p_telefone text DEFAULT NULL::text,
  p_endereco text DEFAULT NULL::text,
  p_cidade text DEFAULT NULL::text,
  p_uf text DEFAULT NULL::text,
  p_cep text DEFAULT NULL::text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  INSERT INTO companies (nome_crm, cnpj, email, telefone, endereco, cidade, uf, cep, status, user_id)
  VALUES (p_nome_crm, p_cnpj, p_email, p_telefone, p_endereco, p_cidade, p_uf, p_cep, 'ativo', auth.uid())
  RETURNING id INTO new_id;

  SELECT jsonb_build_object(
    'success', true,
    'company_id', new_id,
    'nome_crm', p_nome_crm,
    'message', 'Empresa criada com sucesso'
  ) INTO result;

  RETURN result;
END;
$$;

-- D5. onboard_new_company: add user_id = auth.uid() to company + contacts inserts
CREATE OR REPLACE FUNCTION public.onboard_new_company(
  p_nome_crm text,
  p_cnpj text DEFAULT NULL::text,
  p_email text DEFAULT NULL::text,
  p_telefone text DEFAULT NULL::text,
  p_cidade text DEFAULT NULL::text,
  p_uf text DEFAULT NULL::text,
  p_contato_nome text DEFAULT NULL::text,
  p_contato_email text DEFAULT NULL::text,
  p_contato_telefone text DEFAULT NULL::text,
  p_vendedor_id integer DEFAULT NULL::integer
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  result jsonb;
  new_company_id uuid;
  new_contact_id uuid;
  new_customer_id uuid;
BEGIN
  INSERT INTO companies (nome_crm, cnpj, email, telefone, cidade, uf, status, user_id)
  VALUES (p_nome_crm, p_cnpj, p_email, p_telefone, p_cidade, p_uf, 'ativo', auth.uid())
  RETURNING id INTO new_company_id;

  IF p_contato_nome IS NOT NULL THEN
    INSERT INTO contacts (company_id, full_name, email, telefone, user_id)
    VALUES (new_company_id, p_contato_nome, p_contato_email, p_contato_telefone, auth.uid())
    RETURNING id INTO new_contact_id;
  END IF;

  INSERT INTO customers (company_id, vendedor_id, cliente_ativado, ja_comprou)
  VALUES (new_company_id, p_vendedor_id, false, false)
  RETURNING id INTO new_customer_id;

  SELECT jsonb_build_object(
    'success', true,
    'company_id', new_company_id,
    'contact_id', new_contact_id,
    'customer_id', new_customer_id,
    'message', 'Onboarding completo realizado'
  ) INTO result;

  RETURN result;
END;
$$;

-- D6. upsert_company: add user_id on INSERT; assert ownership on UPDATE path
CREATE OR REPLACE FUNCTION public.upsert_company(
  p_cnpj text,
  p_nome_crm text,
  p_email text DEFAULT NULL::text,
  p_telefone text DEFAULT NULL::text,
  p_endereco text DEFAULT NULL::text,
  p_cidade text DEFAULT NULL::text,
  p_uf text DEFAULT NULL::text,
  p_cep text DEFAULT NULL::text
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  result jsonb;
  existing_id uuid;
  new_id uuid;
  clean_cnpj text;
BEGIN
  clean_cnpj := REGEXP_REPLACE(p_cnpj, '[^0-9]', '', 'g');

  SELECT id INTO existing_id
  FROM companies
  WHERE REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g') = clean_cnpj AND deleted_at IS NULL
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    -- Caller must own the existing company before updating it
    PERFORM public.assert_company_access(existing_id);

    UPDATE companies SET
      nome_crm   = COALESCE(p_nome_crm, nome_crm),
      email      = COALESCE(p_email, email),
      telefone   = COALESCE(p_telefone, telefone),
      endereco   = COALESCE(p_endereco, endereco),
      cidade     = COALESCE(p_cidade, cidade),
      uf         = COALESCE(p_uf, uf),
      cep        = COALESCE(p_cep, cep),
      updated_at = now()
    WHERE id = existing_id;

    SELECT jsonb_build_object('success', true, 'action', 'updated', 'company_id', existing_id)
    INTO result;
  ELSE
    INSERT INTO companies (cnpj, nome_crm, email, telefone, endereco, cidade, uf, cep, status, user_id)
    VALUES (p_cnpj, p_nome_crm, p_email, p_telefone, p_endereco, p_cidade, p_uf, p_cep, 'ativo', auth.uid())
    RETURNING id INTO new_id;

    SELECT jsonb_build_object('success', true, 'action', 'created', 'company_id', new_id)
    INTO result;
  END IF;

  RETURN result;
END;
$$;

-- D7. create_template: add created_by = auth.uid()
CREATE OR REPLACE FUNCTION public.create_template(
  p_name text,
  p_channel text,
  p_body text,
  p_category text DEFAULT NULL::text,
  p_subject text DEFAULT NULL::text,
  p_variables text[] DEFAULT '{}'::text[]
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO message_templates (name, channel, body, category, subject, variables, created_by)
  VALUES (p_name, p_channel, p_body, p_category, p_subject, p_variables, auth.uid())
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('success', true, 'template_id', v_id);
END;
$$;

-- D8. create_webhook (no p_user_id overload): add created_by = auth.uid()
CREATE OR REPLACE FUNCTION public.create_webhook(
  p_name text,
  p_url text,
  p_events text[],
  p_secret text DEFAULT NULL::text,
  p_headers jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO webhooks (name, url, events, secret, headers, created_by)
  VALUES (p_name, p_url, p_events, p_secret, p_headers, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- D9. resolve_alerts_batch: inline batch ownership check
CREATE OR REPLACE FUNCTION public.resolve_alerts_batch(p_alert_ids uuid[])
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  result jsonb;
  affected int;
BEGIN
  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM alerts
    WHERE id = ANY(p_alert_ids) AND user_id IS DISTINCT FROM auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized: one or more alerts do not belong to you'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE alerts SET resolved_at = now()
  WHERE id = ANY(p_alert_ids) AND resolved_at IS NULL;
  GET DIAGNOSTICS affected = ROW_COUNT;

  SELECT jsonb_build_object(
    'success', true,
    'total_enviados', array_length(p_alert_ids, 1),
    'total_resolvidos', affected,
    'resolved_at', now()
  ) INTO result;

  RETURN result;
END;
$$;

-- D10. record_nps_response: ownership check via nps_surveys.company_id
CREATE OR REPLACE FUNCTION public.record_nps_response(
  p_survey_id uuid,
  p_score integer,
  p_feedback text DEFAULT NULL::text
)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $$
DECLARE
  v_company_id uuid;
BEGIN
  SELECT company_id INTO v_company_id FROM nps_surveys WHERE id = p_survey_id;

  -- Only block if the survey is linked to a company that belongs to a different user
  IF auth.uid() IS NOT NULL AND v_company_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM companies WHERE id = v_company_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'Unauthorized: NPS survey % does not belong to the current user', p_survey_id
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  UPDATE nps_surveys SET
    score        = p_score,
    feedback     = p_feedback,
    responded_at = NOW()
  WHERE id = p_survey_id AND score IS NULL;
  RETURN FOUND;
END;
$$;

-- ── E. Service-role-only lockdown ─────────────────────────────────────────────
-- These functions are admin-only, automation-only, reference dormant tables, or
-- operate on shared catalogs — they must never be callable by end-users via REST.
DO $$
DECLARE
  r record; fn_def text; new_def text;
  nl_begin text := chr(10) || 'BEGIN' || chr(10);
  nl_begin_pos int;
  guard_call text :=
    chr(10) || '  IF auth.uid() IS NOT NULL THEN' ||
    chr(10) || '    RAISE EXCEPTION ''This function is reserved for the service role''' ||
    chr(10) || '      USING ERRCODE = ''insufficient_privilege'';' ||
    chr(10) || '  END IF;';
  patched int := 0; skipped int := 0;
  service_only_fns text[] := ARRAY[
    -- Admin commission workflows
    'approve_commission', 'pay_commission',
    -- Automation engine
    'execute_automation_v2',
    -- Shared product catalog management
    'fn_apply_auto_tag_rules', 'update_product_stock',
    -- Admin SDR/closer and portfolio management
    'vincular_sdr_closer', 'encerrar_vinculo_sdr_closer', 'transfer_portfolio',
    -- Background/automation functions
    'count_segment_companies', 'update_campaign_metrics', 'populate_campaign_from_segment',
    -- References dormant/non-existent tables
    'run_custom_report', 'resolver_alerta_inativacao',
    -- Admin catalog management
    'criar_grupo_economico', 'create_territory', 'create_competitor',
    'create_custom_field', 'create_message_template',
    -- Dynamic SQL / generic entity operations (security boundary)
    'set_custom_field', 'set_custom_field_value',
    -- Webhook registration (no user attribution in target table)
    'register_webhook'
  ];
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_functiondef(p.oid) AS def
    FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.prosecdef = true
      AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
      AND p.proname = ANY(service_only_fns)
      AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
    ORDER BY p.proname
  LOOP
    fn_def := replace(r.def, chr(13)||chr(10), chr(10));
    fn_def := replace(fn_def, 'SET search_path TO ''public'', ''pg_temp''', 'SET search_path TO ''public'', ''pg_catalog''');
    nl_begin_pos := strpos(fn_def, nl_begin);
    IF nl_begin_pos = 0 THEN
      RAISE WARNING '[Wave 163] No BEGIN in % (service-lock); skipped', r.proname;
      skipped := skipped+1; CONTINUE;
    END IF;
    new_def := substring(fn_def FROM 1 FOR nl_begin_pos+5) || guard_call || substring(fn_def FROM nl_begin_pos+6);
    IF new_def NOT LIKE '%auth.uid()%' THEN
      RAISE WARNING '[Wave 163] auth.uid() guard missing in % (service-lock)', r.proname;
      skipped := skipped+1; CONTINUE;
    END IF;
    BEGIN EXECUTE new_def; patched := patched+1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[Wave 163] EXECUTE failed % (service-lock): %', r.proname, SQLERRM;
      skipped := skipped+1;
    END;
  END LOOP;
  RAISE NOTICE '[Wave 163] Service-role-only guard applied to % functions; % skipped', patched, skipped;
END;
$$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE still_unguarded int;
BEGIN
  SELECT COUNT(*) INTO still_unguarded
  FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND p.prolang = (SELECT oid FROM pg_language WHERE lanname = 'plpgsql')
    AND (pg_get_functiondef(p.oid) ~* '\yINSERT\y|\yUPDATE\y|\yDELETE\y')
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_%access%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%assert_self_user_id%'
    AND pg_get_functiondef(p.oid) NOT LIKE '%auth.uid()%'
    AND p.proname NOT LIKE 'singu_%'
    AND p.prorettype != 'pg_catalog.trigger'::regtype;
  RAISE NOTICE '[Wave 163] Remaining unguarded SECURITY DEFINER DML functions: %', still_unguarded;
END;
$$;
