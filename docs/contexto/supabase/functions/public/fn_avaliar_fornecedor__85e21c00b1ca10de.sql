CREATE OR REPLACE FUNCTION public.fn_avaliar_fornecedor(p_supplier_id uuid, p_avaliador_id integer, p_nota_preco integer, p_nota_prazo integer, p_nota_qualidade integer, p_nota_entrega integer, p_referencia text DEFAULT NULL::text, p_comentario text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_eval_id UUID;
  v_score_geral NUMERIC;
  v_classificacao TEXT;
  v_homologado BOOLEAN;
  v_warning TEXT := NULL;
BEGIN
  -- Validação: supplier existe?
  IF NOT EXISTS(SELECT 1 FROM suppliers WHERE id = p_supplier_id) THEN
    RETURN json_build_object('success', false, 'error', 'Fornecedor não encontrado');
  END IF;

  -- Validação: avaliador ativo?
  IF NOT EXISTS(SELECT 1 FROM users WHERE id = p_avaliador_id AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Avaliador não encontrado ou inativo');
  END IF;

  -- Validação: notas entre 1 e 5
  IF p_nota_preco NOT BETWEEN 1 AND 5 OR p_nota_prazo NOT BETWEEN 1 AND 5 
     OR p_nota_qualidade NOT BETWEEN 1 AND 5 OR p_nota_entrega NOT BETWEEN 1 AND 5 THEN
    RETURN json_build_object('success', false, 'error', 'Todas as notas devem ser entre 1 e 5');
  END IF;

  -- CHECK: homologação
  SELECT s.homologado INTO v_homologado FROM suppliers s WHERE s.id = p_supplier_id;
  IF v_homologado = false THEN
    v_warning := 'ATENÇÃO: Fornecedor NÃO está homologado! Avaliação registrada, mas o fornecedor precisa ser homologado pelo Depto de Compras antes de novos negócios.';
  END IF;

  -- Inserir avaliação (trigger recalcula score automaticamente)
  INSERT INTO supplier_evaluations (supplier_id, avaliador_id, referencia, nota_preco, nota_prazo, nota_qualidade, nota_entrega, comentario)
  VALUES (p_supplier_id, p_avaliador_id, p_referencia, p_nota_preco, p_nota_prazo, p_nota_qualidade, p_nota_entrega, p_comentario)
  RETURNING id INTO v_eval_id;

  -- Buscar score recalculado
  SELECT ss.score_geral, ss.classificacao INTO v_score_geral, v_classificacao
  FROM supplier_scores ss WHERE ss.supplier_id = p_supplier_id;

  RETURN json_build_object(
    'success', true,
    'evaluation_id', v_eval_id,
    'supplier_id', p_supplier_id,
    'nota_geral_avaliacao', ROUND((p_nota_preco + p_nota_prazo + p_nota_qualidade + p_nota_entrega)::numeric / 4.0, 2),
    'score_consolidado', v_score_geral,
    'classificacao', v_classificacao,
    'homologado', v_homologado,
    'warning', v_warning
  );
END;
$function$
