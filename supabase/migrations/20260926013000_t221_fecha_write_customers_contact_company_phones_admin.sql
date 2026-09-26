-- Gap encontrado na auditoria pós-PR#62: aquela PR restringiu só o SELECT de customers/
-- contact_phones/company_phones a admin. INSERT/UPDATE/DELETE ficaram com qual/with_check
-- = "auth.uid() IS NOT NULL" -- qualquer usuário logado insere/edita/apaga qualquer linha
-- das 3 tabelas (~48 mil clientes), inclusive setando vendedor_id livremente, contornando
-- o motor de rodízio. Confirmado sem impacto: registrar_pedido_erp (ERP) só faz UPDATE em
-- customer já existente e roda como service_role (RLS não se aplica); front-end não tem
-- nenhum .from(...) direto pra essas 3 tabelas; external-data grava contact_phones/
-- company_phones via service_role (também bypassa RLS). Mesmo padrão has_role já usado em
-- customers_select.

ALTER POLICY customers_insert ON public.customers
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY customers_update ON public.customers
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY customers_delete ON public.customers
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY contact_phones_insert ON public.contact_phones
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY contact_phones_update ON public.contact_phones
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY contact_phones_delete ON public.contact_phones
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY company_phones_insert ON public.company_phones
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY company_phones_update ON public.company_phones
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER POLICY company_phones_delete ON public.company_phones
  USING (has_role(auth.uid(), 'admin'::app_role));
