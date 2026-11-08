CREATE OR REPLACE FUNCTION public.get_at_risk_accounts(p_user_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 30)
 RETURNS TABLE(company_id uuid, company_name text, risk_score integer, risk_factors text[], last_interaction timestamp with time zone, last_sentiment text, days_inactive integer)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  WITH risk_calc AS (
    SELECT 
      c.id as cid,
      c.nome_fantasia,
      0 
      + CASE WHEN MAX(i.created_at) < NOW() - INTERVAL '30 days' THEN 30 ELSE 0 END
      + CASE WHEN MAX(i.created_at) < NOW() - INTERVAL '60 days' THEN 20 ELSE 0 END
      + CASE WHEN COUNT(CASE WHEN i.sentiment = 'negativo' AND i.created_at > NOW() - INTERVAL '90 days' THEN 1 END) >= 2 THEN 25 ELSE 0 END
      + CASE WHEN COUNT(CASE WHEN i.follow_up_required AND NOT COALESCE(i.followup_concluido, FALSE) THEN 1 END) >= 3 THEN 15 ELSE 0 END
      + CASE WHEN COUNT(CASE WHEN i.prioridade IN ('alta', 'urgente') AND i.status = 'pendente' THEN 1 END) >= 1 THEN 10 ELSE 0 END
      as score,
      MAX(i.created_at) as last_int,
      (SELECT sentiment FROM interactions WHERE company_id = c.id ORDER BY created_at DESC LIMIT 1) as last_sent,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN MAX(i.created_at) < NOW() - INTERVAL '60 days' THEN 'Inativo há 60+ dias' END,
        CASE WHEN COUNT(CASE WHEN i.sentiment = 'negativo' AND i.created_at > NOW() - INTERVAL '90 days' THEN 1 END) >= 2 THEN 'Sentimento negativo recorrente' END,
        CASE WHEN COUNT(CASE WHEN i.follow_up_required AND NOT COALESCE(i.followup_concluido, FALSE) THEN 1 END) >= 3 THEN 'Followups pendentes' END,
        CASE WHEN COUNT(CASE WHEN i.prioridade IN ('alta', 'urgente') AND i.status = 'pendente' THEN 1 END) >= 1 THEN 'Urgências não resolvidas' END
      ], NULL) as factors
    FROM companies c
    LEFT JOIN interactions i ON i.company_id = c.id
    WHERE c.deleted_at IS NULL
      AND c.status = 'ativo'
      AND (p_user_id IS NULL OR c.user_id = p_user_id)
    GROUP BY c.id, c.nome_fantasia
    HAVING 0 
      + CASE WHEN MAX(i.created_at) < NOW() - INTERVAL '30 days' THEN 30 ELSE 0 END
      + CASE WHEN MAX(i.created_at) < NOW() - INTERVAL '60 days' THEN 20 ELSE 0 END
      + CASE WHEN COUNT(CASE WHEN i.sentiment = 'negativo' AND i.created_at > NOW() - INTERVAL '90 days' THEN 1 END) >= 2 THEN 25 ELSE 0 END
      + CASE WHEN COUNT(CASE WHEN i.follow_up_required AND NOT COALESCE(i.followup_concluido, FALSE) THEN 1 END) >= 3 THEN 15 ELSE 0 END
      > 20
  )
  SELECT 
    cid,
    nome_fantasia::TEXT,
    score,
    factors,
    last_int,
    last_sent,
    COALESCE((CURRENT_DATE - last_int::DATE), 999)
  FROM risk_calc
  ORDER BY score DESC
  LIMIT p_limit;
END;
$function$
