-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329182125
-- nome:   create_fn_avaliar_fornecedor

CREATE OR REPLACE FUNCTION fn_avaliar_fornecedor(
  p_supplier_id UUID,
  p_avaliador_id INTEGER,
  p_nota_preco INTEGER,
  p_nota_prazo INTEGER,
  p_nota_qualidade INTEGER,
  p_nota_entrega INTEGER,
  p_referencia TEXT DEFAULT NULL,
  p_comentario TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_eval_id UUID;
  v_score_geral NUMERIC;
  v_classificacao TEXT;
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
    'classificacao', v_classificacao
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_avaliar_fornecedor IS 
'Registra avaliação de fornecedor com validações. Score é recalculado automaticamente via trigger.
Notas de 1 a 5 para: preço, prazo, qualidade, entrega.';
