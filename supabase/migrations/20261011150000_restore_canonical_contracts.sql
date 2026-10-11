-- Pesquisas sem resposta não possuem nota; análises RFM podem ser de contatos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.csat_surveys'::regclass
      AND conname = 'csat_surveys_answered_score_check'
  ) AND EXISTS (SELECT 1 FROM public.csat_surveys)
    AND current_setting('singu.legacy_survey_types_confirmed', true) IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Confirme a modalidade das pesquisas históricas e reconcilie nps_score antes de aplicar esta migration (docs/qa/survey-contract-migration.md)';
  END IF;
END;
$$;
ALTER TABLE public.csat_surveys ALTER COLUMN score DROP NOT NULL;
ALTER TABLE public.csat_surveys ALTER COLUMN sent_at DROP NOT NULL;
ALTER TABLE public.csat_surveys ALTER COLUMN sent_at DROP DEFAULT;
ALTER TABLE public.csat_surveys
  ADD COLUMN IF NOT EXISTS survey_type text DEFAULT 'csat',
  ADD COLUMN IF NOT EXISTS nps_score integer,
  ADD COLUMN IF NOT EXISTS ces_score integer;
ALTER TABLE public.csat_surveys ALTER COLUMN survey_type SET DEFAULT 'csat';
ALTER TABLE public.csat_surveys ALTER COLUMN survey_type SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.csat_surveys'::regclass AND conname='csat_surveys_type_contract_check') THEN
    ALTER TABLE public.csat_surveys ADD CONSTRAINT csat_surveys_type_contract_check
      CHECK (survey_type IN ('csat', 'nps', 'ces', 'custom'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.csat_surveys'::regclass AND conname='csat_surveys_nps_contract_check') THEN
    ALTER TABLE public.csat_surveys ADD CONSTRAINT csat_surveys_nps_contract_check
      CHECK (nps_score BETWEEN 0 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.csat_surveys'::regclass AND conname='csat_surveys_ces_contract_check') THEN
    ALTER TABLE public.csat_surveys ADD CONSTRAINT csat_surveys_ces_contract_check
      CHECK (ces_score BETWEEN 1 AND 7);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.csat_surveys'::regclass AND conname='csat_surveys_answered_score_check') THEN
    ALTER TABLE public.csat_surveys ADD CONSTRAINT csat_surveys_answered_score_check CHECK (
      status <> 'answered' OR CASE survey_type
        WHEN 'csat' THEN score IS NOT NULL
        WHEN 'nps' THEN nps_score IS NOT NULL
        WHEN 'ces' THEN ces_score IS NOT NULL
        WHEN 'custom' THEN true
        ELSE false
      END
    ) NOT VALID;
  END IF;
END;
$$;
ALTER TABLE public.csat_surveys VALIDATE CONSTRAINT csat_surveys_answered_score_check;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='csat_surveys' AND policyname='csat_surveys_owner') THEN
    CREATE POLICY csat_surveys_owner ON public.csat_surveys FOR ALL TO authenticated
      USING ((SELECT auth.uid()) = user_id)
      WITH CHECK ((SELECT auth.uid()) = user_id);
  END IF;
END;
$$;
ALTER TABLE public.rfm_analysis
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS segment_code text;
ALTER TABLE public.rfm_analysis ALTER COLUMN company_id DROP NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.rfm_analysis'::regclass AND conname = 'rfm_analysis_entity_check') THEN
    ALTER TABLE public.rfm_analysis ADD CONSTRAINT rfm_analysis_entity_check
      CHECK (company_id IS NOT NULL OR contact_id IS NOT NULL) NOT VALID;
  END IF;
END;
$$;
ALTER TABLE public.rfm_analysis VALIDATE CONSTRAINT rfm_analysis_entity_check;
UPDATE public.rfm_analysis SET segment_code = segment WHERE segment_code IS NULL;
ALTER TABLE public.rfm_analysis ALTER COLUMN segment_code SET NOT NULL;

-- Campos da validação humana e das ramificações já previstos nas migrations históricas.
ALTER TABLE public.vak_analysis_history
  ADD COLUMN IF NOT EXISTS is_validated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_feedback text;
ALTER TABLE public.metaprogram_analysis
  ADD COLUMN IF NOT EXISTS is_validated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS user_feedback text;
ALTER TABLE public.sequence_steps
  ADD COLUMN IF NOT EXISTS condition_type text NOT NULL DEFAULT 'always',
  ADD COLUMN IF NOT EXISTS condition_wait_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS branch_on_yes_step integer,
  ADD COLUMN IF NOT EXISTS branch_on_no_step integer;
ALTER TABLE public.sequence_steps ALTER COLUMN condition_type SET DEFAULT 'always';
ALTER TABLE public.sequence_steps ALTER COLUMN condition_type SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.sequence_steps'::regclass AND conname='sequence_steps_condition_type_contract_check') THEN
    ALTER TABLE public.sequence_steps ADD CONSTRAINT sequence_steps_condition_type_contract_check
      CHECK (condition_type IN ('always', 'if_opened', 'if_clicked', 'if_not_opened', 'if_not_replied', 'if_replied'));
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_csat_survey(_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF _token IS NULL THEN RETURN NULL; END IF;
  SELECT CASE
    WHEN s.expires_at IS NOT NULL AND s.expires_at <= now()
      THEN jsonb_build_object('id', s.id, 'expires_at', s.expires_at)
    ELSE jsonb_build_object(
      'id', s.id, 'survey_type', s.survey_type,
      'score', CASE s.survey_type WHEN 'nps' THEN s.nps_score WHEN 'ces' THEN s.ces_score ELSE s.score END,
      'rating_min', CASE s.survey_type WHEN 'nps' THEN 0 WHEN 'csat' THEN 1 WHEN 'ces' THEN 1 END,
      'rating_max', CASE s.survey_type WHEN 'nps' THEN 10 WHEN 'csat' THEN 5 WHEN 'ces' THEN 7 END,
      'feedback', s.feedback, 'status', s.status, 'channel', s.channel, 'expires_at', s.expires_at
    ) END
  INTO _result FROM public.csat_surveys s WHERE s.public_token = _token LIMIT 1;
  RETURN _result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_public_csat_survey(_token uuid, _score integer, _feedback text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _id uuid;
  _type text;
BEGIN
  IF _token IS NULL OR _score IS NULL THEN
    RAISE EXCEPTION 'pesquisa ou nota inválida' USING ERRCODE = '22023';
  END IF;
  SELECT id, survey_type INTO _id, _type FROM public.csat_surveys
  WHERE public_token = _token AND status IN ('pending', 'sent')
    AND (expires_at IS NULL OR expires_at > now()) FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF _type IS NULL OR _type NOT IN ('csat', 'nps', 'ces') THEN
    RAISE EXCEPTION 'tipo de pesquisa sem escala pública configurada' USING ERRCODE = '22023';
  END IF;
  IF (_type = 'csat' AND _score NOT BETWEEN 1 AND 5)
    OR (_type = 'nps' AND _score NOT BETWEEN 0 AND 10)
    OR (_type = 'ces' AND _score NOT BETWEEN 1 AND 7) THEN
    RAISE EXCEPTION 'nota fora da escala da pesquisa' USING ERRCODE = '22023';
  END IF;
  UPDATE public.csat_surveys SET
    score = CASE WHEN _type = 'csat' THEN _score ELSE score END,
    nps_score = CASE WHEN _type = 'nps' THEN _score ELSE nps_score END,
    ces_score = CASE WHEN _type = 'ces' THEN _score ELSE ces_score END,
    feedback = nullif(left(btrim(coalesce(_feedback, '')), 1000), ''),
    status = 'answered', answered_at = now()
  WHERE id = _id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.get_public_csat_survey(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_csat_survey(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_csat_survey(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_public_csat_survey(uuid, integer, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.persist_rfm_analysis(_rows jsonb, _user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  _owner uuid := COALESCE(_user_id, auth.uid());
  _saved integer;
BEGIN
  IF _owner IS NULL OR (current_user NOT IN ('postgres', 'service_role')
      AND _owner IS DISTINCT FROM auth.uid()) THEN
    RAISE EXCEPTION 'usuário RFM não autorizado' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'análises RFM devem ser uma lista' USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(_rows) > 10000 THEN
    RAISE EXCEPTION 'limite de análises RFM excedido' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_populate_recordset(NULL::public.rfm_analysis, _rows) r
    WHERE r.user_id IS DISTINCT FROM _owner OR r.contact_id IS NULL
      OR NOT EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = r.contact_id AND c.user_id = _owner)
  ) THEN
    RAISE EXCEPTION 'contato RFM não pertence ao usuário' USING ERRCODE = '42501';
  END IF;
  WITH saved AS (
    INSERT INTO public.rfm_analysis (
      user_id, contact_id, recency_score, frequency_score, monetary_score,
      days_since_last_purchase, days_since_last_interaction, total_purchases, total_interactions,
      total_monetary_value, average_order_value, segment, segment_code, segment_description,
      segment_color, churn_probability, communication_priority, predicted_next_purchase_date,
      predicted_lifetime_value, recommended_actions, recommended_offers, analyzed_at
    )
    SELECT r.user_id, r.contact_id, r.recency_score, r.frequency_score, r.monetary_score,
      r.days_since_last_purchase, r.days_since_last_interaction, r.total_purchases, r.total_interactions,
      r.total_monetary_value, r.average_order_value, r.segment, r.segment_code, r.segment_description,
      r.segment_color, r.churn_probability, r.communication_priority, r.predicted_next_purchase_date,
      r.predicted_lifetime_value, r.recommended_actions, r.recommended_offers, COALESCE(r.analyzed_at, now())
    FROM jsonb_populate_recordset(NULL::public.rfm_analysis, _rows) r
    ON CONFLICT (user_id, contact_id) DO UPDATE SET
      recency_score = EXCLUDED.recency_score, frequency_score = EXCLUDED.frequency_score,
      monetary_score = EXCLUDED.monetary_score, days_since_last_purchase = EXCLUDED.days_since_last_purchase,
      days_since_last_interaction = EXCLUDED.days_since_last_interaction,
      total_purchases = EXCLUDED.total_purchases, total_interactions = EXCLUDED.total_interactions,
      total_monetary_value = EXCLUDED.total_monetary_value, average_order_value = EXCLUDED.average_order_value,
      segment = EXCLUDED.segment, segment_code = EXCLUDED.segment_code,
      segment_description = EXCLUDED.segment_description, segment_color = EXCLUDED.segment_color,
      churn_probability = EXCLUDED.churn_probability, communication_priority = EXCLUDED.communication_priority,
      predicted_next_purchase_date = EXCLUDED.predicted_next_purchase_date,
      predicted_lifetime_value = EXCLUDED.predicted_lifetime_value,
      recommended_actions = EXCLUDED.recommended_actions, recommended_offers = EXCLUDED.recommended_offers,
      analyzed_at = EXCLUDED.analyzed_at, updated_at = now()
    RETURNING user_id, contact_id, recency_score, frequency_score, monetary_score, segment, total_monetary_value
  )
  INSERT INTO public.rfm_history (user_id, contact_id, recency_score, frequency_score, monetary_score, segment, total_monetary_value)
  SELECT user_id, contact_id, recency_score, frequency_score, monetary_score, segment, total_monetary_value FROM saved;
  GET DIAGNOSTICS _saved = ROW_COUNT;
  RETURN _saved;
END;
$$;
REVOKE ALL ON FUNCTION public.persist_rfm_analysis(jsonb, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.persist_rfm_analysis(jsonb, uuid) TO authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.rfm_history TO authenticated;

-- DOWN MIGRATION (Rollback)
-- Fazer backup dos novos campos antes de removê-los. A reversão das duas
-- nulabilidades exige que não existam pesquisas sem nota nem RFM sem empresa:
-- não preencher respostas ou vínculos desconhecidos com valores artificiais.
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.persist_rfm_analysis(jsonb, uuid);
-- REVOKE SELECT, INSERT ON TABLE public.rfm_history FROM authenticated;
-- Executar o REVOKE apenas se estes grants não existiam antes da migration;
-- no canônico já existiam. Registrar o ACL original antes de aplicar a reversão.
-- DROP POLICY IF EXISTS csat_surveys_owner ON public.csat_surveys;
-- ALTER TABLE public.csat_surveys DROP CONSTRAINT IF EXISTS csat_surveys_answered_score_check;
-- ALTER TABLE public.csat_surveys DROP CONSTRAINT IF EXISTS csat_surveys_type_contract_check;
-- ALTER TABLE public.csat_surveys DROP CONSTRAINT IF EXISTS csat_surveys_nps_contract_check;
-- ALTER TABLE public.csat_surveys DROP CONSTRAINT IF EXISTS csat_surveys_ces_contract_check;
-- Restaurar o default anterior de survey_type conforme o catálogo salvo antes da migration.
-- ALTER TABLE public.csat_surveys ALTER COLUMN survey_type DROP NOT NULL;
-- ALTER TABLE public.csat_surveys ALTER COLUMN score SET NOT NULL;
-- ALTER TABLE public.csat_surveys ALTER COLUMN sent_at SET DEFAULT now();
-- ALTER TABLE public.csat_surveys ALTER COLUMN sent_at SET NOT NULL;
-- ALTER TABLE public.rfm_analysis ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE public.rfm_analysis DROP CONSTRAINT IF EXISTS rfm_analysis_entity_check;
-- ALTER TABLE public.vak_analysis_history
--   DROP COLUMN IF EXISTS is_validated, DROP COLUMN IF EXISTS user_feedback;
-- ALTER TABLE public.metaprogram_analysis
--   DROP COLUMN IF EXISTS is_validated, DROP COLUMN IF EXISTS user_feedback;
-- ALTER TABLE public.sequence_steps
--   DROP COLUMN IF EXISTS condition_type, DROP COLUMN IF EXISTS condition_wait_hours,
--   DROP COLUMN IF EXISTS branch_on_yes_step, DROP COLUMN IF EXISTS branch_on_no_step;
-- COMMIT;
-- Para reverter as duas RPCs públicas, reaplicar as definições e os grants da
-- seção 5 de 20261006120000_least_privilege_canonical.sql. Isso restaura o
-- contrato antigo 0–10 que gravava em score; não é compatível com respostas NPS.
-- survey_type/nps_score/ces_score e segment_code ficam preservados para não
-- apagar respostas e classificações existentes. NOT NULL só pode voltar após
-- tratar registros pendentes; não preencher com notas ou datas de envio falsas.
-- Preservar company_id e segment_code: no canônico eram colunas preexistentes.
