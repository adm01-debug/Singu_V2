-- 1. Secure SECURITY DEFINER functions by setting an explicit search_path
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid, p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' 
        AND prosecdef = true
    ) LOOP
        EXECUTE format('ALTER FUNCTION %s SET search_path = public', r.oid::regprocedure);
    END LOOP;
END $$;

-- 2. Revoke execute on SECURITY DEFINER functions from PUBLIC unless they are intended to be RPCs
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT p.oid, p.proname
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' 
        AND prosecdef = true
        AND proname NOT IN (
            'search_contacts_unaccent', 'search_contacts_semantic', 'search_companies_semantic',
            'search_contacts_by_nlp', 'submit_public_form', 'get_score_explicability'
        )
    ) LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, authenticated, anon', r.oid::regprocedure);
    END LOOP;
END $$;

-- 3. Update v_contact_personality_audit to avoid exposing auth.users
DROP VIEW IF EXISTS public.v_contact_personality_audit;
CREATE VIEW public.v_contact_personality_audit AS
SELECT l.id,
    l.contact_id,
    l.created_at AS "timestamp",
    p.first_name || ' ' || p.last_name AS user_name,
    l.change_source,
    l.field_name,
    l.old_value,
    l.new_value,
    l.reason
   FROM (public.crm_relationship_audit_logs l
     LEFT JOIN public.profiles p ON ((l.user_id = p.id)))
  WHERE ((l.reason ~~ '%Atualização de perfil comportamental%'::text) OR (l.field_name = ANY (ARRAY['big_five_openness'::text, 'big_five_confidence'::text, 'mbti_type'::text, 'mbti_e_i_score'::text, 'enneagram_type'::text, 'enneagram_wing'::text, 'temperament_primary'::text])))
  ORDER BY l.created_at DESC;

-- 4. Fix RLS for brain_dominance_analysis
ALTER TABLE public.brain_dominance_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view brain dominance analysis" ON public.brain_dominance_analysis;
CREATE POLICY "Users can view brain dominance analysis" ON public.brain_dominance_analysis
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contacts c 
            WHERE c.id = brain_dominance_analysis.contact_id 
            AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update brain dominance analysis" ON public.brain_dominance_analysis;
CREATE POLICY "Users can update brain dominance analysis" ON public.brain_dominance_analysis
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.contacts c 
            WHERE c.id = brain_dominance_analysis.contact_id 
            AND c.user_id = auth.uid()
        )
    );

-- 5. Fix RLS for neuro_pnl_sessions
ALTER TABLE public.neuro_pnl_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view neuro pnl sessions" ON public.neuro_pnl_sessions;
CREATE POLICY "Users can view neuro pnl sessions" ON public.neuro_pnl_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.contacts c 
            WHERE c.id = neuro_pnl_sessions.contact_id 
            AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update neuro pnl sessions" ON public.neuro_pnl_sessions;
CREATE POLICY "Users can update neuro pnl sessions" ON public.neuro_pnl_sessions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.contacts c 
            WHERE c.id = neuro_pnl_sessions.contact_id 
            AND c.user_id = auth.uid()
        )
    );

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_contact_id ON public.interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_interactions_company_id ON public.interactions(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_dominance_contact_id ON public.brain_dominance_analysis(contact_id);
CREATE INDEX IF NOT EXISTS idx_neuro_pnl_contact_id ON public.neuro_pnl_sessions(contact_id);
