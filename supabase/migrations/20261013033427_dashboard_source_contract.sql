-- UP MIGRATION: completa as fontes canônicas do dashboard quando ausentes no replay.
DO $columns$
DECLARE
  field record;
BEGIN
  FOR field IN SELECT * FROM (VALUES
    ('contacts', 'full_name', $generated$text GENERATED ALWAYS AS
      (trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) STORED$generated$),
    ('contacts', 'nome_tratamento', 'varchar(100)'),
    ('contacts', 'apelido', 'varchar(100)'),
    ('contacts', 'cargo', 'text'),
    ('profiles', 'full_name', $generated$text GENERATED ALWAYS AS
      (trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))) STORED$generated$),
    ('interactions', 'conteudo', 'text'),
    ('interactions', 'created_by', 'uuid'),
    ('interactions', 'usuario_responsavel_id', 'integer')
  ) AS fields(table_name, column_name, column_type) LOOP
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns c WHERE c.table_schema = 'public'
        AND c.table_name = field.table_name AND c.column_name = field.column_name) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS %I %s',
        field.table_name, field.column_name, field.column_type);
    END IF;
  END LOOP;
END;
$columns$;

DO $sources$
DECLARE
  new_relations text[] := '{}';
  relation_table text;
BEGIN
  IF to_regclass('public.contact_emails') IS NULL THEN
    CREATE TABLE public.contact_emails (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
      email_type public.email_type DEFAULT 'corporativo',
      email varchar(255) NOT NULL,
      email_normalizado varchar(255),
      is_primary boolean DEFAULT false,
      is_verified boolean DEFAULT false,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      fonte varchar(100),
      contexto varchar(200),
      confiabilidade smallint DEFAULT 0
    );
    CREATE UNIQUE INDEX contact_emails_contact_lower_idx
      ON public.contact_emails(contact_id, lower(email));
    new_relations := array_append(new_relations, 'contact_emails');
  END IF;
  IF to_regclass('public.contact_phones') IS NULL THEN
    CREATE TABLE public.contact_phones (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
      phone_type public.phone_type DEFAULT 'fixo_comercial',
      numero_normalizado varchar(20) NOT NULL,
      is_primary boolean DEFAULT false,
      is_whatsapp boolean DEFAULT false,
      is_verified boolean DEFAULT false,
      observacao varchar(100),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      numero_e164 varchar(20),
      fonte varchar(100),
      contexto varchar(200),
      confiabilidade smallint,
      numero varchar(50) NOT NULL,
      CONSTRAINT contact_phones_contact_id_numero_norm_unique UNIQUE (contact_id, numero_normalizado)
    );
    CREATE INDEX contact_phones_contact_id_idx ON public.contact_phones(contact_id);
    CREATE FUNCTION public.dashboard_normalize_contact_phone() RETURNS trigger
      LANGUAGE plpgsql SET search_path = pg_catalog, public AS $phone$
    BEGIN
      NEW.numero_normalizado := regexp_replace(NEW.numero, '[^0-9]', '', 'g');
      IF NEW.numero_normalizado = '' THEN
        RAISE EXCEPTION 'Número de telefone inválido';
      END IF;
      RETURN NEW;
    END;
    $phone$;
    CREATE TRIGGER dashboard_normalize_contact_phone
      BEFORE INSERT OR UPDATE OF numero, numero_normalizado ON public.contact_phones
      FOR EACH ROW EXECUTE FUNCTION public.dashboard_normalize_contact_phone();
    new_relations := array_append(new_relations, 'contact_phones');
  END IF;
  FOREACH relation_table IN ARRAY new_relations LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_table);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', relation_table);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', relation_table);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', relation_table);
    EXECUTE format('CREATE POLICY dashboard_contact_owner_read ON public.%I FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %I.contact_id
        AND c.user_id = (SELECT auth.uid()) AND c.deleted_at IS NULL))', relation_table, relation_table);
    EXECUTE format('CREATE POLICY dashboard_contact_owner_scope ON public.%I AS RESTRICTIVE
      FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %I.contact_id
        AND c.user_id = (SELECT auth.uid()) AND c.deleted_at IS NULL))
      WITH CHECK (EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %I.contact_id
        AND c.user_id = (SELECT auth.uid()) AND c.deleted_at IS NULL))',
      relation_table, relation_table, relation_table);
    EXECUTE format('CREATE POLICY dashboard_contact_owner_write ON public.%I FOR ALL
      TO authenticated USING (true) WITH CHECK (true)', relation_table);
  END LOOP;
END;
$sources$;

DO $health$
BEGIN
  IF to_regclass('public.vw_singu_data_health') IS NULL THEN
    CREATE VIEW public.vw_singu_data_health WITH (security_invoker = true) AS
    WITH metrics AS (
      SELECT
        (SELECT count(*) FROM public.companies WHERE user_id IS NOT NULL)::numeric /
          NULLIF((SELECT count(*) FROM public.companies), 0)::numeric * 100 AS pct_companies_uid,
        (SELECT count(*) FROM public.contacts WHERE user_id IS NOT NULL AND deleted_at IS NULL)::numeric /
          NULLIF((SELECT count(*) FROM public.contacts WHERE deleted_at IS NULL), 0)::numeric * 100 AS pct_contacts_uid,
        (SELECT count(*) FROM public.companies WHERE cnpj IS NOT NULL AND cnpj <> '')::numeric /
          NULLIF((SELECT count(*) FROM public.companies), 0)::numeric * 100 AS pct_cnpj,
        (SELECT count(*) FROM public.interactions) AS interactions_total,
        (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND rowsecurity)::numeric /
          NULLIF((SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public'), 0)::numeric * 100 AS pct_rls,
        (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = ANY (ARRAY[
          'disc_analysis_history', 'disc_communication_logs', 'disc_conversion_metrics', 'eq_analysis_history',
          'cognitive_bias_history', 'metaprogram_analysis', 'emotional_states_history', 'emotional_anchors',
          'hidden_objections', 'decision_criteria', 'client_values', 'offer_suggestions', 'insights',
          'contact_cadence', 'contact_preferences', 'communication_preferences', 'contact_relatives',
          'contact_time_analysis', 'life_events', 'compatibility_alerts', 'compatibility_settings',
          'health_alerts', 'health_alert_settings', 'automation_rules', 'automation_logs', 'lux_intelligence',
          'favorite_templates', 'companies', 'contacts', 'interactions', 'activities', 'alerts',
          'disc_profile_config'
        ]))::numeric / 33::numeric * 100 AS pct_singu,
        (SELECT count(*) FROM public.compatibility_settings) AS s1,
        (SELECT count(*) FROM public.health_alert_settings) AS s2,
        (SELECT count(*) FROM public.automation_rules) AS s3,
        (SELECT count(*) FROM pg_catalog.pg_views WHERE schemaname = 'public' AND viewname LIKE 'vw_singu_%') AS vs,
        (SELECT count(*) FROM pg_catalog.pg_constraint c JOIN pg_catalog.pg_namespace n ON c.connamespace = n.oid
          WHERE n.nspname = 'public' AND c.contype = 'c' AND c.conname LIKE 'chk_%') AS chks,
        (SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public') AS tt,
        (SELECT count(*) FROM pg_catalog.pg_views WHERE schemaname = 'public') AS tv
    ), scores AS (
      SELECT round(pct_companies_uid / 10, 1) AS score_user_id_companies,
        round(pct_contacts_uid / 10, 1) AS score_user_id_contacts,
        round(pct_cnpj / 10, 1) AS score_cnpj,
        CASE WHEN interactions_total > 1000 THEN 10 WHEN interactions_total > 0 THEN 4 ELSE 0 END AS score_interactions,
        round(pct_rls / 10, 1) AS score_rls,
        round(pct_singu / 10, 1) AS score_singu_tables,
        CASE WHEN s1 > 0 AND s2 > 0 AND s3 > 0 THEN 10 ELSE 5 END AS score_seeds,
        CASE WHEN vs >= 9 THEN 10 WHEN vs >= 5 THEN 7 ELSE 3 END AS score_views,
        CASE WHEN chks >= 20 THEN 10 WHEN chks >= 10 THEN 7 ELSE 3 END AS score_constraints
      FROM metrics
    )
    SELECT NULL::uuid AS user_id,
      score_user_id_companies, score_user_id_contacts, score_cnpj, score_interactions,
      score_rls, score_singu_tables, score_seeds, score_views, score_constraints,
      round((score_user_id_companies + score_user_id_contacts +
        score_rls * 2 + score_singu_tables * 2 + score_interactions * 1.5 +
        score_seeds * 0.5 + score_views * 0.5 + score_constraints * 0.5 +
        score_cnpj * 0.5) / 9.5, 1) AS health_score,
      tt AS total_tables, tv AS total_views, interactions_total,
      s1 AS seeds_compat, s2 AS seeds_health, s3 AS seeds_auto, vs AS views_singu,
      chks AS check_constraints, now() AS measured_at
    FROM metrics CROSS JOIN scores;
    REVOKE ALL ON public.vw_singu_data_health FROM PUBLIC, anon, authenticated;
    GRANT SELECT ON public.vw_singu_data_health TO authenticated, service_role;
  END IF;
END;
$health$;

-- DOWN MIGRATION: preservar as fontes e os dados já existentes no canônico.
-- SELECT 'Colunas e relações aditivas mantidas para as views e os consumidores legados';
-- Se uma instalação nova precisar retirar o dashboard, remova primeiro as views
-- e arquive os dados antes de remover somente os objetos criados por este UP.
-- Nunca remover tabelas, policies ou colunas que já existiam antes desta migration.
-- Somente depois de comprovar que as fontes foram criadas por este UP e arquivar
-- seus dados, retirar as views dependentes e executar, se necessário:
-- DROP TABLE IF EXISTS public.contact_emails;
-- DROP TABLE IF EXISTS public.contact_phones;
-- DROP FUNCTION IF EXISTS public.dashboard_normalize_contact_phone();
