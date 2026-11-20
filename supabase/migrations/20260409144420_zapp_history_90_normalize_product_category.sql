-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409144420
-- nome:   zapp_history_90_normalize_product_category

-- Função: normaliza nome de produto (singular, lowercase, busca no dicionário com fuzzy)
CREATE OR REPLACE FUNCTION zapp_history.normalize_product_name(p_name TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_lower TEXT;
  v_match TEXT;
BEGIN
  IF p_name IS NULL THEN RETURN NULL; END IF;
  v_lower := lower(trim(p_name));

  -- Match exato no canonical
  SELECT canonical_name INTO v_match FROM zapp_history.product_dictionary WHERE canonical_name = v_lower LIMIT 1;
  IF v_match IS NOT NULL THEN RETURN v_match; END IF;

  -- Match em qualquer pattern
  SELECT canonical_name INTO v_match
  FROM zapp_history.product_dictionary
  WHERE v_lower = ANY(patterns) OR v_lower = ANY(SELECT lower(unnest(patterns)))
  LIMIT 1;
  IF v_match IS NOT NULL THEN RETURN v_match; END IF;

  -- Match removendo plural simples (s/es no final)
  IF v_lower ~ 's$' THEN
    SELECT canonical_name INTO v_match
    FROM zapp_history.product_dictionary
    WHERE canonical_name = regexp_replace(v_lower, 's$', '')
       OR regexp_replace(v_lower, 's$', '') = ANY(patterns)
    LIMIT 1;
    IF v_match IS NOT NULL THEN RETURN v_match; END IF;
  END IF;

  -- LIKE fuzzy: dicionário contém o nome
  SELECT canonical_name INTO v_match
  FROM zapp_history.product_dictionary
  WHERE EXISTS (
    SELECT 1 FROM unnest(patterns) p WHERE v_lower LIKE '%' || lower(p) || '%' OR lower(p) LIKE '%' || v_lower || '%'
  )
  ORDER BY length(canonical_name) ASC
  LIMIT 1;

  RETURN COALESCE(v_match, v_lower);
END;
$fn$;

-- Recria view top_produtos usando normalização
CREATE OR REPLACE VIEW zapp_history.v_top_produtos_demanda AS
WITH normalized AS (
  SELECT
    m.*,
    zapp_history.normalize_product_name(m.nlp_structured_order->>'product') AS produto_canonico
  FROM zapp_history.messages m
  WHERE m.nlp_structured_order ? 'product'
)
SELECT
  n.produto_canonico AS produto,
  pd.category AS categoria,
  COUNT(*) AS total_pedidos,
  COUNT(DISTINCT n.contact_id) AS clientes_unicos,
  SUM((n.nlp_structured_order->>'quantity')::INT) AS volume_total,
  AVG((n.nlp_structured_order->>'quantity')::INT)::INT AS quantidade_media,
  AVG(n.lead_score)::numeric(5,2) AS lead_score_medio,
  COUNT(*) FILTER (WHERE n.lead_score >= 80) AS leads_hot,
  COUNT(*) FILTER (WHERE n.nlp_sentiment = 'urgent') AS pedidos_urgentes,
  AVG(n.budget_detected)::numeric(12,2) AS ticket_medio_detectado,
  MIN(n.created_at) AS primeiro_pedido,
  MAX(n.created_at) AS ultimo_pedido
FROM normalized n
LEFT JOIN zapp_history.product_dictionary pd ON pd.canonical_name = n.produto_canonico
GROUP BY n.produto_canonico, pd.category
ORDER BY total_pedidos DESC, volume_total DESC NULLS LAST;

GRANT SELECT ON zapp_history.v_top_produtos_demanda TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.normalize_product_name(TEXT) TO authenticated, service_role;
