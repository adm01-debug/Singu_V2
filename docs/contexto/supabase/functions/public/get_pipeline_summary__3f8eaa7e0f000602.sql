CREATE OR REPLACE FUNCTION public.get_pipeline_summary(p_user_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN (
    SELECT jsonb_build_object(
      'by_status', (
        SELECT COALESCE(jsonb_object_agg(COALESCE(status, 'Não definido'), dados), '{}'::jsonb)
        FROM (
          SELECT status::text,
            jsonb_build_object(
              'count', COUNT(*),
              'recent', COUNT(*) FILTER (WHERE created_at >= NOW() - interval '30 days')
            ) AS dados
          FROM companies
          WHERE p_user_id IS NULL OR user_id = p_user_id
          GROUP BY status
        ) t
      ),
      'by_segment', (
        SELECT COALESCE(jsonb_object_agg(COALESCE(ramo_atividade, 'Não definido'), cnt), '{}'::jsonb)
        FROM (
          SELECT ramo_atividade, COUNT(*) AS cnt
          FROM companies
          WHERE status = 'ativo'
            AND (p_user_id IS NULL OR user_id = p_user_id)
          GROUP BY ramo_atividade
          ORDER BY cnt DESC
          LIMIT 10
        ) t
      ),
      'by_state', (
        SELECT COALESCE(jsonb_object_agg(COALESCE(estado, 'N/A'), cnt), '{}'::jsonb)
        FROM (
          SELECT a.estado, COUNT(*) AS cnt
          FROM companies c
          LEFT JOIN LATERAL (
            SELECT ca.estado FROM company_addresses ca
            WHERE ca.company_id = c.id
            ORDER BY ca.is_primary DESC NULLS LAST, ca.created_at, ca.id
            LIMIT 1
          ) a ON true
          WHERE c.status = 'ativo'
            AND (p_user_id IS NULL OR c.user_id = p_user_id)
          GROUP BY a.estado
          ORDER BY cnt DESC, a.estado
          LIMIT 10
        ) t
      ),
      'totals', jsonb_build_object(
        'active', (SELECT COUNT(*) FROM companies WHERE status = 'ativo' AND (p_user_id IS NULL OR user_id = p_user_id)),
        'inactive', (SELECT COUNT(*) FROM companies WHERE status = 'inativo' AND (p_user_id IS NULL OR user_id = p_user_id)),
        'with_recent_interaction', (
          SELECT COUNT(DISTINCT c.id)
          FROM companies c
          JOIN interactions i ON i.company_id = c.id AND i.data_interacao >= NOW() - interval '30 days'
          WHERE p_user_id IS NULL OR c.user_id = p_user_id
        )
      )
    )
  );
END;
$function$
