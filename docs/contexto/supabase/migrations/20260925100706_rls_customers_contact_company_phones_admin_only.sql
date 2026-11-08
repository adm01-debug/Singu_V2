-- Dívida técnica documentada em scripts/rls-matrix/rls-baseline.json (Fase 3): customers,
-- contact_phones e company_phones tinham SELECT liberado pra qualquer usuário authenticated
-- (auth.uid() IS NOT NULL), expondo ~48 mil clientes e telefones. Não há nenhum .from(...)
-- direto pra essas 3 tabelas no frontend (confirmado via grep) — todo acesso real passa por
-- RPC (que roda como service_role). Restringe SELECT a admin, mesmo padrão já usado nas
-- 4 tabelas do rodízio (admin_select / has_role).
ALTER POLICY customers_select ON public.customers
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY contact_phones_select ON public.contact_phones
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY company_phones_select ON public.company_phones
  USING (has_role(auth.uid(), 'admin'::app_role));
