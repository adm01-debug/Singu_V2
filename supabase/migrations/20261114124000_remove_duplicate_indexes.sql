-- Recupera a PR 232 e remove os mesmos 18 índices redundantes após conferir o catálogo.
-- Pares e definições conferidos no snapshot de origin/contexto d6cbf0e437fed7f01569f921787ec7d65e3df22e.
-- A definição esperada protege também a fidelidade do rollback comentado ao final.
-- A operação inteira é atômica. Divergência ou espera por lock acima de 5 s desfaz tudo.
-- DROP INDEX exige lock exclusivo na tabela. Execute em uma janela de baixa atividade.
-- Constraints, identidade de replicação e índice preferido de CLUSTER são preservados.

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
SET LOCAL search_path = pg_catalog;

DO $migration$
DECLARE
  par record;
  candidato_oid oid;
  mantido_oid oid;
  tabela_oid oid;
  candidato record;
  mantido record;
BEGIN
  FOR par IN
    SELECT * FROM (VALUES
      ('whatsapp_messages', 'idx_whatsapp_messages_company', 'idx_whatsapp_messages_company_id', 'ON public.whatsapp_messages USING btree (company_id)'),
      ('whatsapp_messages', 'idx_whatsapp_messages_contact', 'idx_whatsapp_messages_contact_id', 'ON public.whatsapp_messages USING btree (contact_id)'),
      ('churn_risk_scores', 'idx_churn_risk_scores_user_id', 'idx_churn_risk_user', 'ON public.churn_risk_scores USING btree (user_id)'),
      ('client_values', 'idx_client_val_contact', 'idx_client_values_contact', 'ON public.client_values USING btree (contact_id)'),
      ('decision_criteria', 'idx_dec_crit_contact', 'idx_decision_criteria_contact', 'ON public.decision_criteria USING btree (contact_id)'),
      ('disc_analysis_history', 'idx_disc_analysis_contact', 'idx_disc_analysis_history_contact', 'ON public.disc_analysis_history USING btree (contact_id)'),
      ('disc_analysis_history', 'idx_disc_analysis_history_user_id', 'idx_disc_analysis_history_user', 'ON public.disc_analysis_history USING btree (user_id)'),
      ('disc_communication_logs', 'idx_disc_comm_contact', 'idx_disc_communication_logs_contact', 'ON public.disc_communication_logs USING btree (contact_id)'),
      ('document_signatures', 'idx_document_signatures_user_id', 'idx_document_signatures_user', 'ON public.document_signatures USING btree (user_id)'),
      ('emotional_anchors', 'idx_emo_anchors_contact', 'idx_emotional_anchors_contact', 'ON public.emotional_anchors USING btree (contact_id)'),
      ('emotional_states_history', 'idx_emo_states_contact', 'idx_emotional_states_contact', 'ON public.emotional_states_history USING btree (contact_id)'),
      ('hidden_objections', 'idx_objections_contact', 'idx_hidden_objections_contact', 'ON public.hidden_objections USING btree (contact_id)'),
      ('neuro_behavioral_history', 'idx_neuro_history_contact', 'idx_neuro_history_contact_id', 'ON public.neuro_behavioral_history USING btree (contact_id)'),
      ('offer_suggestions', 'idx_offer_sug_contact', 'idx_offer_suggestions_contact', 'ON public.offer_suggestions USING btree (contact_id)'),
      ('sales', 'legacy_sales_salesperson_scope_idx', 'idx_sales_salesperson_id', 'ON public.sales USING btree (salesperson_id)'),
      ('sales_activities', 'legacy_sales_activities_sale_scope_idx', 'idx_sales_activities_sale_id', 'ON public.sales_activities USING btree (sale_id)'),
      ('sales_activities', 'legacy_sales_activities_salesperson_scope_idx', 'idx_sales_activities_salesperson_id', 'ON public.sales_activities USING btree (salesperson_id)'),
      ('system_health_snapshots', 'idx_health_snapshots_timestamp_desc', 'idx_system_health_snapshots_timestamp', 'ON public.system_health_snapshots USING btree ("timestamp" DESC)')
    ) AS pares(tabela, remover, preservar, definicao)
    ORDER BY tabela, remover
  LOOP
    candidato_oid := to_regclass(format('public.%I', par.remover));
    IF candidato_oid IS NULL THEN
      CONTINUE;
    END IF;

    tabela_oid := to_regclass(format('public.%I', par.tabela));
    IF tabela_oid IS NULL THEN
      RAISE EXCEPTION 'Tabela esperada public.% ausente para %', par.tabela, par.remover;
    END IF;

    -- Ordem estável de tabelas e lock mantido até o COMMIT impedem troca concorrente dos índices.
    EXECUTE format('LOCK TABLE public.%I IN ACCESS EXCLUSIVE MODE', par.tabela);
    candidato_oid := to_regclass(format('public.%I', par.remover));
    IF candidato_oid IS NULL THEN
      CONTINUE;
    END IF;
    mantido_oid := to_regclass(format('public.%I', par.preservar));
    IF mantido_oid IS NULL THEN
      RAISE EXCEPTION 'Índice preservado public.% ausente para %', par.preservar, par.remover;
    END IF;

    SELECT i.*, c.relam, c.relkind, c.reloptions, c.reltablespace,
           pg_get_expr(i.indexprs, i.indrelid) AS expressoes,
           pg_get_expr(i.indpred, i.indrelid) AS predicado
      INTO candidato
      FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
      WHERE i.indexrelid = candidato_oid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Objeto public.% não é um índice', par.remover;
    END IF;
    SELECT i.*, c.relam, c.relkind, c.reloptions, c.reltablespace,
           pg_get_expr(i.indexprs, i.indrelid) AS expressoes,
           pg_get_expr(i.indpred, i.indrelid) AS predicado
      INTO mantido
      FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
      WHERE i.indexrelid = mantido_oid;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Objeto public.% não é um índice', par.preservar;
    END IF;

    IF candidato.indrelid <> tabela_oid OR mantido.indrelid <> tabela_oid
       OR candidato.relkind <> 'i' OR mantido.relkind <> 'i'
       OR NOT (candidato.indisvalid AND candidato.indisready AND candidato.indislive
               AND mantido.indisvalid AND mantido.indisready AND mantido.indislive) THEN
      RAISE EXCEPTION 'Par % / % fora da tabela esperada ou sem índices válidos e prontos', par.remover, par.preservar;
    END IF;
    IF candidato.indisreplident OR candidato.indisclustered
       OR EXISTS (SELECT 1 FROM pg_constraint WHERE conindid = candidato_oid)
       OR EXISTS (SELECT 1 FROM pg_depend WHERE classid = 'pg_class'::regclass
                  AND objid = candidato_oid AND deptype = 'e')
       OR EXISTS (SELECT 1 FROM pg_inherits WHERE inhrelid = candidato_oid OR inhparent = candidato_oid) THEN
      RAISE EXCEPTION 'Índice % sustenta constraint, replicação, CLUSTER, extensão ou particionamento', par.remover;
    END IF;

    IF ROW(candidato.indrelid, candidato.relam, candidato.indnatts, candidato.indnkeyatts,
           candidato.indkey, candidato.indclass, candidato.indcollation, candidato.indoption,
           candidato.expressoes, candidato.predicado, candidato.indisunique,
           candidato.indnullsnotdistinct, candidato.indimmediate, candidato.indisexclusion,
           candidato.reloptions, candidato.reltablespace)
       IS DISTINCT FROM
       ROW(mantido.indrelid, mantido.relam, mantido.indnatts, mantido.indnkeyatts,
           mantido.indkey, mantido.indclass, mantido.indcollation, mantido.indoption,
           mantido.expressoes, mantido.predicado, mantido.indisunique,
           mantido.indnullsnotdistinct, mantido.indimmediate, mantido.indisexclusion,
           mantido.reloptions, mantido.reltablespace) THEN
      RAISE EXCEPTION 'Índices % / % têm definições distintas no catálogo', par.remover, par.preservar;
    END IF;

    -- Mudança simultânea dos dois índices também exige nova auditoria e novo rollback.
    IF pg_get_indexdef(candidato_oid) <> format('CREATE INDEX %I %s', par.remover, par.definicao)
       OR pg_get_indexdef(mantido_oid) <> format('CREATE INDEX %I %s', par.preservar, par.definicao) THEN
      RAISE EXCEPTION 'Par % / % mudou desde o snapshot auditado', par.remover, par.preservar;
    END IF;
    EXECUTE format('DROP INDEX public.%I', par.remover);
  END LOOP;
END;
$migration$;
COMMIT;

-- Rollback manual após a migration concluída, em janela de manutenção.
-- Definições exatas dos candidatos extraídas de docs/contexto/supabase/snapshot.json
-- no commit d6cbf0e437fed7f01569f921787ec7d65e3df22e de origin/contexto.
-- A validação acima exige essas mesmas definições antes de qualquer remoção.
-- BEGIN;
-- SET LOCAL lock_timeout = '5s';
-- SET LOCAL statement_timeout = '60s';
-- CREATE INDEX idx_whatsapp_messages_company ON public.whatsapp_messages USING btree (company_id);
-- CREATE INDEX idx_whatsapp_messages_contact ON public.whatsapp_messages USING btree (contact_id);
-- CREATE INDEX idx_churn_risk_scores_user_id ON public.churn_risk_scores USING btree (user_id);
-- CREATE INDEX idx_client_val_contact ON public.client_values USING btree (contact_id);
-- CREATE INDEX idx_dec_crit_contact ON public.decision_criteria USING btree (contact_id);
-- CREATE INDEX idx_disc_analysis_contact ON public.disc_analysis_history USING btree (contact_id);
-- CREATE INDEX idx_disc_analysis_history_user_id ON public.disc_analysis_history USING btree (user_id);
-- CREATE INDEX idx_disc_comm_contact ON public.disc_communication_logs USING btree (contact_id);
-- CREATE INDEX idx_document_signatures_user_id ON public.document_signatures USING btree (user_id);
-- CREATE INDEX idx_emo_anchors_contact ON public.emotional_anchors USING btree (contact_id);
-- CREATE INDEX idx_emo_states_contact ON public.emotional_states_history USING btree (contact_id);
-- CREATE INDEX idx_objections_contact ON public.hidden_objections USING btree (contact_id);
-- CREATE INDEX idx_neuro_history_contact ON public.neuro_behavioral_history USING btree (contact_id);
-- CREATE INDEX idx_offer_sug_contact ON public.offer_suggestions USING btree (contact_id);
-- CREATE INDEX legacy_sales_salesperson_scope_idx ON public.sales USING btree (salesperson_id);
-- CREATE INDEX legacy_sales_activities_sale_scope_idx ON public.sales_activities USING btree (sale_id);
-- CREATE INDEX legacy_sales_activities_salesperson_scope_idx ON public.sales_activities USING btree (salesperson_id);
-- CREATE INDEX idx_health_snapshots_timestamp_desc ON public.system_health_snapshots USING btree ("timestamp" DESC);
-- COMMIT;
