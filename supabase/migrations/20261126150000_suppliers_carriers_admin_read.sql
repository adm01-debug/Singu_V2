-- Leitura de fornecedores e transportadoras para o admin, sem exigir MFA.
--
-- As policies `*_owner_or_admin_mfa` dessas 12 tabelas liberam o admin apenas com
-- `jwt->>'aal' = 'aal2'`, e nenhum usuario do sistema tem MFA habilitado. Como o vinculo
-- com a empresa e `company_id -> companies.user_id` e a base veio de carga externa
-- (praticamente todo `companies.user_id` e NULL), o resultado era 754 fornecedores e 114
-- transportadoras invisiveis: as 14 views de ranking/homologacao/qualidade existem,
-- tem dados e devolviam 0 linhas.
--
-- Este bloco abre SOMENTE leitura (FOR SELECT) para admin, mantendo a escrita e a
-- exigencia de MFA nas policies existentes. Mesmo padrao ja usado em `contact_phones_*`
-- (admin sem MFA) para dado comercial de contato.
CREATE POLICY suppliers_select_admin ON public.suppliers
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY carriers_select_admin ON public.carriers
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY supplier_scores_select_admin ON public.supplier_scores
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY carrier_scores_select_admin ON public.carrier_scores
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY supplier_evaluations_select_admin ON public.supplier_evaluations
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY carrier_evaluations_select_admin ON public.carrier_evaluations
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY supplier_homologations_select_admin ON public.supplier_homologations
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY carrier_homologations_select_admin ON public.carrier_homologations
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY supplier_score_history_select_admin ON public.supplier_score_history
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

CREATE POLICY carrier_score_history_select_admin ON public.carrier_score_history
  FOR SELECT TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));