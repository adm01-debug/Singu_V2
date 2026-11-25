-- Fecha a parte nao refletida da migration 20260721190726_drop_duplicate_indexes.sql (Wave 119).
--
-- A producao registrou 62 DROP INDEX nessa versao (supabase_migrations.schema_migrations), mas
-- 38 desses indices continuam no catalogo hoje. Destes:
--   - 9 ainda tem o par que a Wave 119 preservou, com corpo identico na mesma tabela
--     (pg_index: indkey, indoption, indclass, indpred, indexprs, unicidade, exclusao e
--     reloptions) e sem constraint nos dois lados -> sao duplicatas exatas hoje, e o que esta
--     migration dropa;
--   - 29 nao tem mais gemeo e estao em uso (pg_stat_user_indexes.idx_scan, de 3 a 368 mil
--     leituras) -> NAO sao tocados aqui; dropar qualquer um deles seria regressao.
--
-- Conferido no banco canonico (pgxfvjmuubtbowutlide), schema public, em 2026-11-24.
-- Operacao atomica e idempotente: ignora o que ja nao existe e recusa qualquer divergencia
-- (gemeo ausente, indice sustentando constraint, corpos diferentes) antes de dropar.
-- Os gemeos sao mantidos; nada no codigo referencia indice por nome.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';
DO $migration$
DECLARE
  par record;
  alvo oid;
  gemeo oid;
  identico boolean;
BEGIN
  FOR par IN
    SELECT * FROM (VALUES
      ('idx_cognitive_bias_history_contact_id', 'idx_cog_bias_contact'),
      ('idx_communication_preferences_contact', 'idx_comm_pref_contact'),
      ('idx_contact_relatives_contact_id',      'idx_relatives_contact'),
      ('idx_contact_time_analysis_contact',     'idx_time_analysis_contact'),
      ('idx_eq_analysis_history_contact_id',    'idx_eq_analysis_contact'),
      ('idx_insights_contact_id',               'idx_insights_contact'),
      ('idx_interactions_contact_id',           'idx_interactions_contact'),
      ('idx_metaprogram_analysis_contact',      'idx_meta_contact'),
      ('idx_metaprogram_analysis_user',         'idx_metaprogram_analysis_user_id')
    ) AS t(t_alvo, t_gemeo)
  LOOP
    alvo := to_regclass('public.' || par.t_alvo);
    IF alvo IS NULL THEN
      RAISE NOTICE '% ja nao existe: nada a fazer', par.t_alvo;
      CONTINUE;
    END IF;

    gemeo := to_regclass('public.' || par.t_gemeo);
    IF gemeo IS NULL THEN
      RAISE EXCEPTION 'o gemeo % de % nao existe: nada foi dropado', par.t_gemeo, par.t_alvo;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conindid IN (alvo, gemeo)) THEN
      RAISE EXCEPTION 'um dos indices de % sustenta constraint: nada foi dropado', par.t_alvo;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM pg_index a
      JOIN pg_index b ON b.indexrelid = gemeo
      JOIN pg_class ca ON ca.oid = a.indexrelid
      JOIN pg_class cb ON cb.oid = b.indexrelid
      WHERE a.indexrelid = alvo
        AND a.indrelid = b.indrelid
        AND a.indkey::text = b.indkey::text
        AND a.indoption::text = b.indoption::text
        AND coalesce(a.indexprs::text, '') = coalesce(b.indexprs::text, '')
        AND coalesce(a.indpred::text, '') = coalesce(b.indpred::text, '')
        AND a.indclass::text = b.indclass::text
        AND a.indisunique = b.indisunique
        AND a.indisexclusion = b.indisexclusion
        AND coalesce(array_to_string(ca.reloptions, ','), '') = coalesce(array_to_string(cb.reloptions, ','), '')
    ) INTO identico;

    IF NOT identico THEN
      RAISE EXCEPTION '% e % nao sao estruturalmente identicos: nada foi dropado', par.t_alvo, par.t_gemeo;
    END IF;

    EXECUTE format('DROP INDEX public.%I', par.t_alvo);
    RAISE NOTICE 'dropado % (gemeo mantido: %)', par.t_alvo, par.t_gemeo;
  END LOOP;
END;
$migration$;
COMMIT;
-- DOWN MIGRATION
-- Recria os 9 indices exatamente como o catalogo os descrevia antes (btree simples, nao unicos):
/*
BEGIN;
CREATE INDEX idx_cognitive_bias_history_contact_id ON public.cognitive_bias_history USING btree (contact_id);
CREATE INDEX idx_communication_preferences_contact ON public.communication_preferences USING btree (contact_id);
CREATE INDEX idx_contact_relatives_contact_id ON public.contact_relatives USING btree (contact_id);
CREATE INDEX idx_contact_time_analysis_contact ON public.contact_time_analysis USING btree (contact_id);
CREATE INDEX idx_eq_analysis_history_contact_id ON public.eq_analysis_history USING btree (contact_id);
CREATE INDEX idx_insights_contact_id ON public.insights USING btree (contact_id);
CREATE INDEX idx_interactions_contact_id ON public.interactions USING btree (contact_id);
CREATE INDEX idx_metaprogram_analysis_contact ON public.metaprogram_analysis USING btree (contact_id);
CREATE INDEX idx_metaprogram_analysis_user ON public.metaprogram_analysis USING btree (user_id);
COMMIT;
*/