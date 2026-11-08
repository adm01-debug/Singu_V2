CREATE OR REPLACE FUNCTION public.calculate_company_score(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  score int := 0;
  factors jsonb := '[]'::jsonb;
  has_email boolean;
  has_phone boolean;
  has_cnpj boolean;
  interaction_count int;
  is_customer boolean;
  has_purchases boolean;
BEGIN
  -- Verificar dados da empresa
  SELECT 
    (email IS NOT NULL AND email != ''),
    (telefone IS NOT NULL AND telefone != ''),
    (cnpj IS NOT NULL AND cnpj != '')
  INTO has_email, has_phone, has_cnpj
  FROM companies WHERE id = p_company_id;
  
  -- Verificar interações
  SELECT COUNT(*) INTO interaction_count FROM interactions WHERE company_id = p_company_id AND created_at >= now() - interval '90 days';
  
  -- Verificar cliente
  SELECT cliente_ativado, ja_comprou INTO is_customer, has_purchases FROM customers WHERE company_id = p_company_id AND deleted_at IS NULL LIMIT 1;
  
  -- Calcular score
  IF has_email THEN score := score + 10; factors := factors || jsonb_build_object('fator', 'email', 'pontos', 10); END IF;
  IF has_phone THEN score := score + 10; factors := factors || jsonb_build_object('fator', 'telefone', 'pontos', 10); END IF;
  IF has_cnpj THEN score := score + 10; factors := factors || jsonb_build_object('fator', 'cnpj', 'pontos', 10); END IF;
  IF interaction_count >= 5 THEN score := score + 25; factors := factors || jsonb_build_object('fator', 'interacoes_frequentes', 'pontos', 25);
  ELSIF interaction_count >= 2 THEN score := score + 15; factors := factors || jsonb_build_object('fator', 'interacoes_moderadas', 'pontos', 15);
  ELSIF interaction_count >= 1 THEN score := score + 5; factors := factors || jsonb_build_object('fator', 'interacoes_baixas', 'pontos', 5);
  END IF;
  IF is_customer THEN score := score + 20; factors := factors || jsonb_build_object('fator', 'cliente_ativado', 'pontos', 20); END IF;
  IF has_purchases THEN score := score + 25; factors := factors || jsonb_build_object('fator', 'ja_comprou', 'pontos', 25); END IF;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'score', score,
    'classificacao', CASE 
      WHEN score >= 80 THEN 'A'
      WHEN score >= 60 THEN 'B'
      WHEN score >= 40 THEN 'C'
      ELSE 'D'
    END,
    'fatores', factors
  ) INTO result;
  
  RETURN result;
END;
$function$
