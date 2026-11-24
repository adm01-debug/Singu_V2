CREATE OR REPLACE FUNCTION public.get_dashboard_data()
 RETURNS json
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Autenticação obrigatória' USING ERRCODE = '42501';
  END IF;
  RETURN jsonb_build_object(
    'generated_at', now(),
    'companies_count', (SELECT count(*) FROM public.companies AS c WHERE c.user_id = v_user_id AND c.deleted_at IS NULL),
    'customers_count', (SELECT count(*) FROM public.companies AS c WHERE c.user_id = v_user_id AND c.deleted_at IS NULL AND c.is_customer),
    'contacts_count', (SELECT count(*) FROM public.contacts AS c WHERE c.user_id = v_user_id AND c.deleted_at IS NULL),
    'deals_count', (SELECT count(*) FROM public.deals AS d WHERE d.user_id = v_user_id),
    'open_deals_count', (SELECT count(*) FROM public.deals AS d WHERE d.user_id = v_user_id AND d.status IN ('aberto','negociando','proposta')),
    'won_deals_count', (SELECT count(*) FROM public.deals AS d WHERE d.user_id = v_user_id AND d.status = 'ganho'),
    'open_pipeline_value', (SELECT COALESCE(sum(d.valor), 0) FROM public.deals AS d WHERE d.user_id = v_user_id AND d.status IN ('aberto','negociando','proposta')),
    'won_deal_value', (SELECT COALESCE(sum(d.valor), 0) FROM public.deals AS d WHERE d.user_id = v_user_id AND d.status = 'ganho'),
    'pending_tasks_count', (SELECT count(*) FROM public.tasks AS t WHERE t.user_id = v_user_id AND t.status IN ('pending','in_progress'))
  )::json;
END;
$function$
