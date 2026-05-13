-- Update search_path for SECURITY DEFINER functions with correct signatures
ALTER FUNCTION public.get_connection_metrics(uuid) SET search_path = public;
ALTER FUNCTION public.increment_form_view(text) SET search_path = public;
ALTER FUNCTION public.move_deal_atomic(uuid, text, integer) SET search_path = public;
ALTER FUNCTION public.move_deal_atomic(uuid, text, numeric) SET search_path = public;
ALTER FUNCTION public.record_family_history() SET search_path = public;
ALTER FUNCTION public.compute_attribution(text, text, numeric) SET search_path = public;
