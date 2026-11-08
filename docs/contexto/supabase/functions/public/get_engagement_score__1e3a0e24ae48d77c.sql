CREATE OR REPLACE FUNCTION public.get_engagement_score(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  score int := 0;
  last_interaction timestamptz;
  interaction_count int;
  contact_count int;
  has_purchase boolean;
BEGIN
  -- Buscar métricas
  SELECT MAX(created_at) INTO last_interaction FROM interactions WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO interaction_count FROM interactions WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO contact_count FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL;
  SELECT ja_comprou INTO has_purchase FROM customers WHERE company_id = p_company_id AND deleted_at IS NULL LIMIT 1;
  
  -- Calcular score
  -- Interação recente: +30 pontos
  IF last_interaction >= now() - interval '30 days' THEN score := score + 30;
  ELSIF last_interaction >= now() - interval '90 days' THEN score := score + 15;
  ELSIF last_interaction IS NOT NULL THEN score := score + 5;
  END IF;
  
  -- Quantidade de interações: até +25 pontos
  score := score + LEAST(interaction_count * 2, 25);
  
  -- Contatos cadastrados: até +20 pontos
  score := score + LEAST(contact_count * 5, 20);
  
  -- Já comprou: +25 pontos
  IF has_purchase THEN score := score + 25; END IF;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'score', score,
    'nivel', CASE 
      WHEN score >= 80 THEN 'alto'
      WHEN score >= 50 THEN 'medio'
      WHEN score >= 20 THEN 'baixo'
      ELSE 'inativo'
    END,
    'detalhes', jsonb_build_object(
      'ultima_interacao', last_interaction,
      'total_interacoes', interaction_count,
      'total_contatos', contact_count,
      'ja_comprou', has_purchase
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
