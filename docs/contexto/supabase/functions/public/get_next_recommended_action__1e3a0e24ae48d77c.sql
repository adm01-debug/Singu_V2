CREATE OR REPLACE FUNCTION public.get_next_recommended_action(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  dias_sem_contato int;
  tem_followup_pendente boolean;
  tem_alerta_pendente boolean;
  tem_cliente boolean;
  ja_comprou boolean;
BEGIN
  SELECT EXTRACT(DAY FROM now() - MAX(created_at))::int INTO dias_sem_contato FROM interactions WHERE company_id = p_company_id;
  SELECT EXISTS(SELECT 1 FROM interactions WHERE company_id = p_company_id AND followup_pendente = true AND data_followup <= now()) INTO tem_followup_pendente;
  SELECT EXISTS(SELECT 1 FROM alerts WHERE company_id = p_company_id AND resolved_at IS NULL) INTO tem_alerta_pendente;
  SELECT EXISTS(SELECT 1 FROM customers WHERE company_id = p_company_id AND cliente_ativado = true AND deleted_at IS NULL) INTO tem_cliente;
  SELECT COALESCE((SELECT cu.ja_comprou FROM customers cu WHERE cu.company_id = p_company_id AND cu.deleted_at IS NULL LIMIT 1), false) INTO ja_comprou;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'acao_recomendada', CASE 
      WHEN tem_followup_pendente THEN 'Realizar followup pendente'
      WHEN tem_alerta_pendente THEN 'Resolver alerta pendente'
      WHEN dias_sem_contato IS NULL THEN 'Fazer primeiro contato'
      WHEN dias_sem_contato > 30 AND tem_cliente THEN 'Reativar relacionamento (30+ dias)'
      WHEN dias_sem_contato > 14 THEN 'Fazer contato de acompanhamento'
      WHEN NOT tem_cliente THEN 'Qualificar e ativar como cliente'
      WHEN tem_cliente AND NOT ja_comprou THEN 'Apresentar proposta comercial'
      ELSE 'Manter relacionamento ativo'
    END,
    'prioridade', CASE 
      WHEN tem_followup_pendente OR tem_alerta_pendente THEN 'alta'
      WHEN dias_sem_contato > 30 THEN 'alta'
      WHEN dias_sem_contato > 14 THEN 'media'
      ELSE 'normal'
    END,
    'contexto', jsonb_build_object(
      'dias_sem_contato', dias_sem_contato,
      'tem_followup', tem_followup_pendente,
      'tem_alerta', tem_alerta_pendente,
      'cliente_ativo', tem_cliente,
      'ja_comprou', ja_comprou
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
