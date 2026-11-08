CREATE OR REPLACE FUNCTION public.get_daily_summary(p_vendedor_id integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  today_start timestamptz := date_trunc('day', now());
BEGIN
  SELECT jsonb_build_object(
    'data', today_start::date,
    'vendedor_id', p_vendedor_id,
    'hoje', jsonb_build_object(
      'interacoes', (
        SELECT COUNT(*) FROM interactions
        WHERE created_at >= today_start
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'empresas_contatadas', (
        SELECT COUNT(DISTINCT company_id) FROM interactions
        WHERE created_at >= today_start
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'novos_contatos', (
        SELECT COUNT(*) FROM contacts
        WHERE created_at >= today_start
        AND deleted_at IS NULL
      )
    ),
    'pendencias', jsonb_build_object(
      'followups_hoje', (
        SELECT COUNT(*) FROM interactions
        WHERE (COALESCE(requer_followup, false) AND NOT COALESCE(followup_concluido, false)
               OR COALESCE(follow_up_required, false))
        AND COALESCE(data_followup, follow_up_date::timestamptz)::date = CURRENT_DATE
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'followups_atrasados', (
        SELECT COUNT(*) FROM interactions
        WHERE (COALESCE(requer_followup, false) AND NOT COALESCE(followup_concluido, false)
               OR COALESCE(follow_up_required, false))
        AND COALESCE(data_followup, follow_up_date::timestamptz) < now()
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'alertas_pendentes', (
        SELECT COUNT(*) FROM alerts a
        LEFT JOIN customers cu ON cu.company_id = a.company_id
        WHERE a.status = 'pending'
        AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
      )
    ),
    'meta_diaria', jsonb_build_object(
      'meta_interacoes', 5,
      'realizado', (
        SELECT COUNT(*) FROM interactions
        WHERE created_at >= today_start
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      ),
      'percentual', (
        SELECT LEAST(ROUND(COUNT(*)::numeric / 5 * 100, 0), 100) FROM interactions
        WHERE created_at >= today_start
        AND (p_vendedor_id IS NULL OR usuario_responsavel_id = p_vendedor_id)
      )
    )
  ) INTO result;

  RETURN result;
END;
$function$
