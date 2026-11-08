-- Corrigir as 4 funções SECURITY DEFINER sem search_path
ALTER FUNCTION public.audit_companies_trigger() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_calculate_lead_score() SET search_path = public, pg_temp;
ALTER FUNCTION public.log_deal_status_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_customer_on_deal_won() SET search_path = public, pg_temp;
