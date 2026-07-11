-- MIGRATION A: Corrigir RLS permissivas (USING/WITH CHECK true) em tabelas psicograficas
-- Estrategia: escopar por ownership do contact (contacts.user_id = auth.uid()) com bypass para admin via has_role.

-- Helper: reescrever policies em bloco por tabela contact_*
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'contact_behavior','contact_business_context','contact_decision_making',
    'contact_influence','contact_metaprograms','contact_personality','contact_rapport_strategy'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
      CASE t
        WHEN 'contact_behavior' THEN 'Allow all for authenticated users on behavior'
        WHEN 'contact_business_context' THEN 'Allow all for authenticated users on business_context'
        WHEN 'contact_decision_making' THEN 'Allow all for authenticated users on decision'
        WHEN 'contact_influence' THEN 'Allow all for authenticated users on influence'
        WHEN 'contact_metaprograms' THEN 'Allow all for authenticated users on metaprograms'
        WHEN 'contact_personality' THEN 'Allow all for authenticated users on personality'
        WHEN 'contact_rapport_strategy' THEN 'Allow all for authenticated users on rapport'
      END, t);

    EXECUTE format($f$
      CREATE POLICY "Owner or admin can select %1$s" ON public.%1$I
        FOR SELECT TO authenticated USING (
          EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %1$I.contact_id AND c.user_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        );
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Owner or admin can insert %1$s" ON public.%1$I
        FOR INSERT TO authenticated WITH CHECK (
          EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %1$I.contact_id AND c.user_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        );
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Owner or admin can update %1$s" ON public.%1$I
        FOR UPDATE TO authenticated
        USING (
          EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %1$I.contact_id AND c.user_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        )
        WITH CHECK (
          EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %1$I.contact_id AND c.user_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        );
    $f$, t);

    EXECUTE format($f$
      CREATE POLICY "Owner or admin can delete %1$s" ON public.%1$I
        FOR DELETE TO authenticated USING (
          EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = %1$I.contact_id AND c.user_id = auth.uid())
          OR public.has_role(auth.uid(), 'admin')
        );
    $f$, t);
  END LOOP;
END $$;

-- brain_dominance_analysis: INSERT permissiva
DROP POLICY IF EXISTS "Users can insert brain dominance analysis" ON public.brain_dominance_analysis;
CREATE POLICY "Owner or admin can insert brain dominance analysis"
  ON public.brain_dominance_analysis
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = brain_dominance_analysis.contact_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- neuro_pnl_sessions: INSERT permissiva
DROP POLICY IF EXISTS "Users can insert neuro pnl sessions" ON public.neuro_pnl_sessions;
CREATE POLICY "Owner or admin can insert neuro pnl sessions"
  ON public.neuro_pnl_sessions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = neuro_pnl_sessions.contact_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- whatsapp_messages_index: SELECT/INSERT permissivas
DROP POLICY IF EXISTS "Users can view whatsapp messages index" ON public.whatsapp_messages_index;
DROP POLICY IF EXISTS "Users can insert whatsapp messages index" ON public.whatsapp_messages_index;
CREATE POLICY "Owner or admin can view whatsapp messages index"
  ON public.whatsapp_messages_index FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = whatsapp_messages_index.contact_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Owner or admin can insert whatsapp messages index"
  ON public.whatsapp_messages_index FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = whatsapp_messages_index.contact_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- social_sync_queue: SELECT permissiva
DROP POLICY IF EXISTS "Users can view their own social sync queue" ON public.social_sync_queue;
CREATE POLICY "Owner or admin can view social sync queue"
  ON public.social_sync_queue FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = social_sync_queue.contact_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- psychographic_audit_log: SELECT permissiva
DROP POLICY IF EXISTS "Users can view psychographic audit logs" ON public.psychographic_audit_log;
CREATE POLICY "Owner or admin can view psychographic audit logs"
  ON public.psychographic_audit_log FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = psychographic_audit_log.contact_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );

-- suggested_life_events: policy "Service role can manage" com TO public true/true — escopa para service_role
DROP POLICY IF EXISTS "Service role can manage suggested life events" ON public.suggested_life_events;
CREATE POLICY "Service role can manage suggested life events"
  ON public.suggested_life_events FOR ALL TO service_role USING (true) WITH CHECK (true);

-- INSERT owner policy (nao existia INSERT owner-side)
CREATE POLICY "Users can insert their own suggested life events"
  ON public.suggested_life_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Admin bypass para SELECT/UPDATE/DELETE existentes de suggested_life_events
DROP POLICY IF EXISTS "Users can view their own suggested life events" ON public.suggested_life_events;
DROP POLICY IF EXISTS "Users can update their own suggested life events" ON public.suggested_life_events;
DROP POLICY IF EXISTS "Users can delete their own suggested life events" ON public.suggested_life_events;
CREATE POLICY "Owner or admin can view suggested life events"
  ON public.suggested_life_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin can update suggested life events"
  ON public.suggested_life_events FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner or admin can delete suggested life events"
  ON public.suggested_life_events FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- sentiment_annotations: SELECT true -> escopar (autor ou admin, ou dono do contato)
DROP POLICY IF EXISTS "Authenticated can view sentiment annotations" ON public.sentiment_annotations;
CREATE POLICY "Owner or admin can view sentiment annotations"
  ON public.sentiment_annotations FOR SELECT TO authenticated USING (
    auth.uid() = created_by
    OR EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = sentiment_annotations.contact_id AND c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin')
  );
