-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260411012403
-- nome:   harden_pks_policies_fk_indexes

-- 1. Dropar tabela staging órfã sem PK
DROP TABLE IF EXISTS public._bcb_postos_temp;

-- 2. uapi_sessions: criar policy restritiva service_role-only
DROP POLICY IF EXISTS uapi_sessions_service_only ON public.uapi_sessions;
CREATE POLICY uapi_sessions_service_only ON public.uapi_sessions
  AS PERMISSIVE FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. Índices nas 29 FKs órfãs
CREATE INDEX IF NOT EXISTS idx_achievements_salesperson_id ON public.achievements(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_activities_interaction_id ON public.activities(interaction_id);
CREATE INDEX IF NOT EXISTS idx_alerts_interaction_id ON public.alerts(interaction_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_user_id ON public.churn_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_deleted_by ON public.clients(deleted_by);
CREATE INDEX IF NOT EXISTS idx_cognitive_bias_history_interaction_id ON public.cognitive_bias_history(interaction_id);
CREATE INDEX IF NOT EXISTS idx_company_stakeholder_map_access_via_contact_id ON public.company_stakeholder_map(access_via_contact_id);
CREATE INDEX IF NOT EXISTS idx_compatibility_alerts_contact_id ON public.compatibility_alerts(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_addresses_updated_by ON public.contact_addresses(updated_by);
CREATE INDEX IF NOT EXISTS idx_contact_addresses_created_by ON public.contact_addresses(created_by);
CREATE INDEX IF NOT EXISTS idx_coop_sistemas_grupo_economico_id ON public.coop_sistemas(grupo_economico_id);
CREATE INDEX IF NOT EXISTS idx_customer_ownership_history_registrado_por_id ON public.customer_ownership_history(registrado_por_id);
CREATE INDEX IF NOT EXISTS idx_customer_sdr_history_closer_destino_id ON public.customer_sdr_history(closer_destino_id);
CREATE INDEX IF NOT EXISTS idx_deal_velocity_analysis_user_id ON public.deal_velocity_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_disc_analysis_history_interaction_id ON public.disc_analysis_history(interaction_id);
CREATE INDEX IF NOT EXISTS idx_disc_communication_logs_interaction_id ON public.disc_communication_logs(interaction_id);
CREATE INDEX IF NOT EXISTS idx_disc_templates_created_by ON public.disc_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_emotional_states_history_interaction_id ON public.emotional_states_history(interaction_id);
CREATE INDEX IF NOT EXISTS idx_eq_analysis_history_interaction_id ON public.eq_analysis_history(interaction_id);
CREATE INDEX IF NOT EXISTS idx_hidden_objections_interaction_id ON public.hidden_objections(interaction_id);
CREATE INDEX IF NOT EXISTS idx_interactions_usuario_responsavel_id ON public.interactions(usuario_responsavel_id);
CREATE INDEX IF NOT EXISTS idx_metaprogram_analysis_interaction_id ON public.metaprogram_analysis(interaction_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_sales_deleted_by ON public.sales(deleted_by);
CREATE INDEX IF NOT EXISTS idx_sales_activities_deleted_by ON public.sales_activities(deleted_by);
CREATE INDEX IF NOT EXISTS idx_sales_tasks_sale_id ON public.sales_tasks(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_tasks_deleted_by ON public.sales_tasks(deleted_by);
CREATE INDEX IF NOT EXISTS idx_sales_tasks_client_id ON public.sales_tasks(client_id);
CREATE INDEX IF NOT EXISTS idx_sdr_closer_assignments_criado_por_id ON public.sdr_closer_assignments(criado_por_id);

-- 4. Dropar índices duplicados (keep menor ID = mais antigo/canônico)
DO $$
DECLARE
  r record;
  keep_idx oid;
  drop_idx oid;
BEGIN
  FOR r IN
    SELECT indrelid, indkey::text AS key, indisunique, array_agg(indexrelid ORDER BY indexrelid) AS idxs
    FROM pg_index
    WHERE indrelid IN (SELECT oid FROM pg_class WHERE relnamespace=(SELECT oid FROM pg_namespace WHERE nspname='public'))
    GROUP BY indrelid, indkey::text, indisunique
    HAVING count(*)>1
  LOOP
    keep_idx := r.idxs[1];
    FOR i IN 2..array_length(r.idxs,1) LOOP
      drop_idx := r.idxs[i];
      -- Nunca droppar índice de PK ou constraint única
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conindid = drop_idx) THEN
        EXECUTE format('DROP INDEX IF EXISTS %I.%I',
          (SELECT nspname FROM pg_namespace n JOIN pg_class c ON c.relnamespace=n.oid WHERE c.oid=drop_idx),
          (SELECT relname FROM pg_class WHERE oid=drop_idx));
        RAISE NOTICE 'Droppado índice duplicado: %', drop_idx::regclass;
      END IF;
    END LOOP;
  END LOOP;
END $$;
