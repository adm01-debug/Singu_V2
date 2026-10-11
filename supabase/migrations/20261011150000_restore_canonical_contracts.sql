-- Pesquisas sem resposta não possuem nota; análises RFM podem ser de contatos.
ALTER TABLE public.csat_surveys ALTER COLUMN score DROP NOT NULL;
ALTER TABLE public.csat_surveys ALTER COLUMN sent_at DROP NOT NULL;
ALTER TABLE public.csat_surveys ALTER COLUMN sent_at DROP DEFAULT;
ALTER TABLE public.csat_surveys
  ADD COLUMN IF NOT EXISTS survey_type text DEFAULT 'csat'
    CHECK (survey_type IN ('csat', 'nps', 'ces', 'custom')),
  ADD COLUMN IF NOT EXISTS nps_score integer CHECK (nps_score BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS ces_score integer CHECK (ces_score BETWEEN 1 AND 7);
DO $$
BEGIN
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
ALTER TABLE public.rfm_analysis
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS segment_code text;
ALTER TABLE public.rfm_analysis ALTER COLUMN company_id DROP NOT NULL;
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
  ADD COLUMN IF NOT EXISTS condition_type text NOT NULL DEFAULT 'always'
    CHECK (condition_type IN ('always', 'if_opened', 'if_clicked', 'if_not_opened', 'if_not_replied', 'if_replied')),
  ADD COLUMN IF NOT EXISTS condition_wait_hours integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS branch_on_yes_step integer,
  ADD COLUMN IF NOT EXISTS branch_on_no_step integer;

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

-- DOWN MIGRATION (Rollback)
-- Fazer backup dos novos campos antes de removê-los. A reversão das duas
-- nulabilidades exige que não existam pesquisas sem nota nem RFM sem empresa:
-- não preencher respostas ou vínculos desconhecidos com valores artificiais.
-- BEGIN;
-- ALTER TABLE public.csat_surveys DROP CONSTRAINT IF EXISTS csat_surveys_answered_score_check;
-- ALTER TABLE public.csat_surveys ALTER COLUMN score SET NOT NULL;
-- ALTER TABLE public.csat_surveys ALTER COLUMN sent_at SET DEFAULT now();
-- ALTER TABLE public.csat_surveys ALTER COLUMN sent_at SET NOT NULL;
-- ALTER TABLE public.rfm_analysis ALTER COLUMN company_id SET NOT NULL;
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
