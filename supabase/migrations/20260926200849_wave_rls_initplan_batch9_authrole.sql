ALTER POLICY "Enable all for authenticated users" ON public.crm_objection_intelligence USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Usuários podem gerenciar inteligência de objeções" ON public.crm_objection_intelligence USING (((select auth.role()) = 'authenticated'::text));
ALTER POLICY "Usuários podem ver inteligência de objeções" ON public.crm_objection_intelligence USING (((select auth.role()) = 'authenticated'::text));
