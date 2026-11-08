CREATE OR REPLACE FUNCTION public.get_urgent_actions(p_vendedor_id integer DEFAULT NULL::integer, p_limit integer DEFAULT 30)
 RETURNS TABLE(company_id uuid, nome_crm text, acao text, prioridade text, dias_sem_interacao integer, vendedor_nome text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as company_id,
    c.nome_crm,
    CASE
      WHEN (SELECT COUNT(*) FROM contacts WHERE company_id = c.id AND deleted_at IS NULL) = 0 THEN 'Cadastrar contato'
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 90 THEN 'Reativar cliente (90+ dias)'
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 60 THEN 'Follow-up urgente (60+ dias)'
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 30 THEN 'Follow-up (30+ dias)'
      ELSE 'Manter contato'
    END as acao,
    CASE
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 90 THEN 'alta'
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 60 THEN 'alta'
      WHEN EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)) > 30 THEN 'media'
      ELSE 'baixa'
    END as prioridade,
    COALESCE(EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id))::int, 999) as dias_sem_interacao,
    s.nome as vendedor_nome
  FROM companies c
  JOIN customers cu ON cu.company_id = c.id AND cu.deleted_at IS NULL
  LEFT JOIN salespeople s ON s.id = cu.vendedor_id
  WHERE c.deleted_at IS NULL
  AND cu.cliente_ativado = true
  AND (p_vendedor_id IS NULL OR cu.vendedor_id = p_vendedor_id)
  AND COALESCE(EXTRACT(DAY FROM now() - (SELECT MAX(created_at) FROM interactions WHERE company_id = c.id)), 999) > 30
  ORDER BY dias_sem_interacao DESC
  LIMIT p_limit;
END;
$function$
