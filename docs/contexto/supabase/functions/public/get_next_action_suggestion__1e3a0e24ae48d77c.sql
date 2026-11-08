CREATE OR REPLACE FUNCTION public.get_next_action_suggestion(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  last_interaction timestamptz;
  days_since_interaction int;
  has_customer boolean;
  is_activated boolean;
  has_purchase boolean;
  contact_count int;
BEGIN
  -- Buscar dados
  SELECT MAX(created_at) INTO last_interaction FROM interactions WHERE company_id = p_company_id;
  days_since_interaction := COALESCE(EXTRACT(DAY FROM now() - last_interaction)::int, 999);
  
  SELECT EXISTS (SELECT 1 FROM customers WHERE company_id = p_company_id AND deleted_at IS NULL) INTO has_customer;
  SELECT cliente_ativado INTO is_activated FROM customers WHERE company_id = p_company_id AND deleted_at IS NULL LIMIT 1;
  SELECT ja_comprou INTO has_purchase FROM customers WHERE company_id = p_company_id AND deleted_at IS NULL LIMIT 1;
  SELECT COUNT(*) INTO contact_count FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'situacao_atual', jsonb_build_object(
      'dias_sem_interacao', days_since_interaction,
      'tem_customer', has_customer,
      'cliente_ativado', is_activated,
      'ja_comprou', has_purchase,
      'total_contatos', contact_count
    ),
    'proxima_acao', CASE
      WHEN contact_count = 0 THEN 'Cadastrar contato principal'
      WHEN NOT has_customer THEN 'Criar registro de cliente'
      WHEN days_since_interaction > 90 THEN 'Cliente inativo há ' || days_since_interaction || ' dias - ligar urgentemente'
      WHEN days_since_interaction > 30 THEN 'Fazer follow-up - ' || days_since_interaction || ' dias sem contato'
      WHEN NOT COALESCE(is_activated, false) THEN 'Ativar cliente'
      WHEN NOT COALESCE(has_purchase, false) THEN 'Enviar proposta comercial'
      ELSE 'Manter relacionamento - cliente ativo'
    END,
    'prioridade', CASE
      WHEN days_since_interaction > 90 THEN 'alta'
      WHEN days_since_interaction > 30 THEN 'media'
      WHEN NOT COALESCE(is_activated, false) THEN 'media'
      ELSE 'baixa'
    END,
    'tipo_acao', CASE
      WHEN contact_count = 0 THEN 'cadastro'
      WHEN NOT has_customer THEN 'cadastro'
      WHEN days_since_interaction > 30 THEN 'reativacao'
      WHEN NOT COALESCE(is_activated, false) THEN 'ativacao'
      WHEN NOT COALESCE(has_purchase, false) THEN 'venda'
      ELSE 'relacionamento'
    END
  ) INTO result;
  
  RETURN result;
END;
$function$
