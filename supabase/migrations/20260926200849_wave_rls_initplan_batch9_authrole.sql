DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_objection_intelligence' AND p.polname='Enable all for authenticated users') THEN
    ALTER POLICY "Enable all for authenticated users" ON public.crm_objection_intelligence USING (((select auth.role()) = 'authenticated'::text));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_objection_intelligence' AND p.polname='Usuários podem gerenciar inteligência de objeções') THEN
    ALTER POLICY "Usuários podem gerenciar inteligência de objeções" ON public.crm_objection_intelligence USING (((select auth.role()) = 'authenticated'::text));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_objection_intelligence' AND p.polname='Usuários podem ver inteligência de objeções') THEN
    ALTER POLICY "Usuários podem ver inteligência de objeções" ON public.crm_objection_intelligence USING (((select auth.role()) = 'authenticated'::text));
  END IF;
END;
$w$;
