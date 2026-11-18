-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417104927
-- nome:   qa_fix_enable_rls_on_17_tables

-- ============================================================================
-- QA FIX: Habilitar RLS nas 17 tabelas desprotegidas + policies padrão
-- ============================================================================

DO $$
DECLARE 
  t text;
  has_user_id boolean;
  policy_template text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'automation_executions','calendar_events','campaign_members','campaigns',
    'cnpj_cache','company_territories','competitive_losses','customer_health_scores',
    'customer_surveys','deal_items','economic_group_members','economic_groups',
    'lead_score_history','message_templates','sales_forecasts','sales_opportunities',
    'seller_daily_metrics'
  ])
  LOOP
    -- Habilitar RLS
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    
    -- Ver se tem user_id
    SELECT EXISTS (SELECT 1 FROM information_schema.columns 
      WHERE table_schema='public' AND table_name=t AND column_name='user_id') 
    INTO has_user_id;
    
    IF has_user_id THEN
      EXECUTE format('CREATE POLICY "Users own data" ON public.%I FOR ALL TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id)', t);
    ELSE
      -- Sem user_id → só authenticated read, service_role full
      EXECUTE format('CREATE POLICY "Authenticated read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    END IF;
    
    -- service_role full
    EXECUTE format('CREATE POLICY "service_role_full" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- Verificar
SELECT count(*) AS ainda_sem_rls
FROM pg_class c 
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=false;
