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
