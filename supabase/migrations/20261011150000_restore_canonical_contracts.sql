-- Pesquisas sem resposta não possuem nota; análises RFM podem ser de contatos.
ALTER TABLE public.csat_surveys ALTER COLUMN score DROP NOT NULL;
ALTER TABLE public.rfm_analysis
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS segment_code text;
ALTER TABLE public.rfm_analysis ALTER COLUMN company_id DROP NOT NULL;

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

-- DOWN MIGRATION (Rollback)
-- Fazer backup dos novos campos antes de removê-los. A reversão das duas
-- nulabilidades exige que não existam pesquisas sem nota nem RFM sem empresa:
-- não preencher respostas ou vínculos desconhecidos com valores artificiais.
-- BEGIN;
-- ALTER TABLE public.csat_surveys ALTER COLUMN score SET NOT NULL;
-- ALTER TABLE public.rfm_analysis ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE public.vak_analysis_history
--   DROP COLUMN IF EXISTS is_validated, DROP COLUMN IF EXISTS user_feedback;
-- ALTER TABLE public.metaprogram_analysis
--   DROP COLUMN IF EXISTS is_validated, DROP COLUMN IF EXISTS user_feedback;
-- ALTER TABLE public.sequence_steps
--   DROP COLUMN IF EXISTS condition_type, DROP COLUMN IF EXISTS condition_wait_hours,
--   DROP COLUMN IF EXISTS branch_on_yes_step, DROP COLUMN IF EXISTS branch_on_no_step;
-- COMMIT;
-- Preservar company_id e segment_code: no canônico eram colunas preexistentes.
