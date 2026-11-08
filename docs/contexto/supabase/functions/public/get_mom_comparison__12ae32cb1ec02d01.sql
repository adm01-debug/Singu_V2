CREATE OR REPLACE FUNCTION public.get_mom_comparison()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  current_month_start date := date_trunc('month', now())::date;
  last_month_start date := (date_trunc('month', now()) - interval '1 month')::date;
  last_month_end date := (date_trunc('month', now()) - interval '1 day')::date;
BEGIN
  SELECT jsonb_build_object(
    'mes_atual', to_char(current_month_start, 'YYYY-MM'),
    'mes_anterior', to_char(last_month_start, 'YYYY-MM'),
    'empresas', jsonb_build_object(
      'mes_atual', (SELECT COUNT(*) FROM companies WHERE created_at >= current_month_start AND deleted_at IS NULL),
      'mes_anterior', (SELECT COUNT(*) FROM companies WHERE created_at >= last_month_start AND created_at < current_month_start AND deleted_at IS NULL),
      'variacao_pct', ROUND(
        ((SELECT COUNT(*) FROM companies WHERE created_at >= current_month_start AND deleted_at IS NULL)::numeric /
        NULLIF((SELECT COUNT(*) FROM companies WHERE created_at >= last_month_start AND created_at < current_month_start AND deleted_at IS NULL), 0) - 1) * 100, 2
      )
    ),
    'interacoes', jsonb_build_object(
      'mes_atual', (SELECT COUNT(*) FROM interactions WHERE created_at >= current_month_start),
      'mes_anterior', (SELECT COUNT(*) FROM interactions WHERE created_at >= last_month_start AND created_at < current_month_start),
      'variacao_pct', ROUND(
        ((SELECT COUNT(*) FROM interactions WHERE created_at >= current_month_start)::numeric /
        NULLIF((SELECT COUNT(*) FROM interactions WHERE created_at >= last_month_start AND created_at < current_month_start), 0) - 1) * 100, 2
      )
    ),
    'clientes_ativados', jsonb_build_object(
      'mes_atual', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= current_month_start AND deleted_at IS NULL),
      'mes_anterior', (SELECT COUNT(*) FROM customers WHERE cliente_ativado = true AND updated_at >= last_month_start AND updated_at < current_month_start AND deleted_at IS NULL)
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
