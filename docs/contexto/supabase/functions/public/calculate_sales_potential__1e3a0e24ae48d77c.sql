CREATE OR REPLACE FUNCTION public.calculate_sales_potential(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  v_interacoes int;
  v_dias_desde_ultima_interacao int;
  v_tem_contato boolean;
  v_valor_historico numeric;
  v_score int := 0;
BEGIN
  -- Contar interações
  SELECT COUNT(*) INTO v_interacoes FROM interactions WHERE company_id = p_company_id;
  
  -- Dias desde última interação
  SELECT EXTRACT(DAY FROM now() - MAX(created_at))::int INTO v_dias_desde_ultima_interacao
  FROM interactions WHERE company_id = p_company_id;
  
  -- Tem contato?
  SELECT EXISTS(SELECT 1 FROM contacts WHERE company_id = p_company_id AND deleted_at IS NULL) INTO v_tem_contato;
  
  -- Valor histórico
  SELECT COALESCE(valor_total_compras, 0) INTO v_valor_historico
  FROM customers WHERE company_id = p_company_id AND deleted_at IS NULL;
  
  -- Calcular score
  IF v_interacoes > 5 THEN v_score := v_score + 30;
  ELSIF v_interacoes > 2 THEN v_score := v_score + 20;
  ELSIF v_interacoes > 0 THEN v_score := v_score + 10;
  END IF;
  
  IF v_dias_desde_ultima_interacao < 7 THEN v_score := v_score + 30;
  ELSIF v_dias_desde_ultima_interacao < 30 THEN v_score := v_score + 20;
  ELSIF v_dias_desde_ultima_interacao < 60 THEN v_score := v_score + 10;
  END IF;
  
  IF v_tem_contato THEN v_score := v_score + 20; END IF;
  IF v_valor_historico > 0 THEN v_score := v_score + 20; END IF;
  
  SELECT jsonb_build_object(
    'company_id', p_company_id,
    'score', v_score,
    'potencial', CASE 
      WHEN v_score >= 80 THEN 'muito_alto'
      WHEN v_score >= 60 THEN 'alto'
      WHEN v_score >= 40 THEN 'medio'
      WHEN v_score >= 20 THEN 'baixo'
      ELSE 'muito_baixo'
    END,
    'fatores', jsonb_build_object(
      'interacoes', v_interacoes,
      'dias_desde_ultima_interacao', v_dias_desde_ultima_interacao,
      'tem_contato', v_tem_contato,
      'valor_historico', v_valor_historico
    )
  ) INTO result;
  
  RETURN result;
END;
$function$
