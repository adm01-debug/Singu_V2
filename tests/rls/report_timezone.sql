BEGIN;
SELECT set_config('rls.tz_owner', (SELECT id::text FROM public.profiles ORDER BY id LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.tz_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.tz_owner'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
SELECT set_config('rls.tz_baseline_br', public.get_daily_summary('2099-11-30', 'America/Sao_Paulo')::text, true);
SELECT set_config('rls.tz_baseline_utc', public.get_daily_summary('2099-12-01', 'UTC')::text, true);
RESET ROLE;

INSERT INTO public.companies (nome_crm, user_id, created_at)
VALUES ('report-timezone fixture', current_setting('rls.tz_owner')::uuid, '2099-12-01 02:30:00+00')
RETURNING set_config('rls.tz_company', id::text, true);
INSERT INTO public.contacts (first_name, user_id, company_id, created_at)
VALUES ('report-timezone fixture', current_setting('rls.tz_owner')::uuid, current_setting('rls.tz_company')::uuid, '2099-12-01 02:30:00+00')
RETURNING set_config('rls.tz_contact', id::text, true);
INSERT INTO public.deals (user_id, company_id, titulo, valor, status, created_at, closed_at)
VALUES (current_setting('rls.tz_owner')::uuid, current_setting('rls.tz_company')::uuid,
  'report-timezone fixture', 137, 'ganho', '2099-12-01 02:30:00+00', '2099-12-01 02:30:00+00');
INSERT INTO public.interactions (user_id, contact_id, company_id, channel, data_interacao,
  requer_followup, followup_concluido, follow_up_date)
VALUES (current_setting('rls.tz_owner')::uuid, current_setting('rls.tz_contact')::uuid,
  current_setting('rls.tz_company')::uuid, 'email', '2099-12-01 02:30:00+00', true, true, '2099-11-30');

SET LOCAL ROLE authenticated;
DO $$
DECLARE
  baseline jsonb := current_setting('rls.tz_baseline_br')::jsonb;
  daily jsonb := public.get_daily_summary('2099-11-30', 'America/Sao_Paulo');
  utc_before jsonb := current_setting('rls.tz_baseline_utc')::jsonb;
  utc_after jsonb := public.get_daily_summary('2099-12-01', 'UTC');
BEGIN
  IF (daily->>'new_companies')::bigint <> (baseline->>'new_companies')::bigint + 1
    OR (daily->>'new_contacts')::bigint <> (baseline->>'new_contacts')::bigint + 1
    OR (daily->>'deals_created')::bigint <> (baseline->>'deals_created')::bigint + 1
    OR (daily->>'deals_won')::bigint <> (baseline->>'deals_won')::bigint + 1
    OR (daily->>'revenue')::numeric <> (baseline->>'revenue')::numeric + 137
    OR (daily->>'interactions_count')::bigint <> (baseline->>'interactions_count')::bigint + 1
    OR (daily->>'followups_completed')::bigint <> (baseline->>'followups_completed')::bigint + 1 THEN
    RAISE EXCEPTION 'Dia brasileiro incorreto: antes %, depois %', baseline, daily;
  END IF;
  IF (utc_after->>'deals_won')::bigint <> (utc_before->>'deals_won')::bigint + 1 THEN
    RAISE EXCEPTION 'O mesmo fechamento deve pertencer a 01/12 em UTC';
  END IF;
  IF public.get_daily_summary(DATE '2099-12-01') IS DISTINCT FROM public.get_daily_summary(DATE '2099-12-01', current_setting('TimeZone')) THEN
    RAISE EXCEPTION 'Contrato legado não preservou o fuso da sessão';
  END IF;
  IF has_function_privilege('anon', 'public.get_daily_summary(date,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Resumo diário não deve aceitar execução anônima';
  END IF;
END $$;
ROLLBACK;
