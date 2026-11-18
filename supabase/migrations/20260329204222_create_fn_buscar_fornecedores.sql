-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260329204222
-- nome:   create_fn_buscar_fornecedores

CREATE OR REPLACE FUNCTION fn_buscar_fornecedores(
  p_termo TEXT DEFAULT NULL,
  p_homologado BOOLEAN DEFAULT NULL,
  p_segment_code TEXT DEFAULT NULL,
  p_estado TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total', (
      SELECT COUNT(*) FROM suppliers s
      JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
      LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
      LEFT JOIN LATERAL (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = co.id ORDER BY ca.is_primary DESC LIMIT 1) addr ON true
      WHERE (p_termo IS NULL OR co.nome_crm ILIKE '%' || p_termo || '%' OR co.cnpj ILIKE '%' || p_termo || '%' OR co.razao_social ILIKE '%' || p_termo || '%')
        AND (p_homologado IS NULL OR s.homologado = p_homologado)
        AND (p_segment_code IS NULL OR ss.segment_code = p_segment_code)
        AND (p_estado IS NULL OR addr.estado = p_estado)
    ),
    'results', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT co.nome_crm AS fornecedor, co.cnpj, s.homologado, s.score_geral,
          ss.classificacao, ss.segment_code, ss.trend, ss.total_avaliacoes,
          addr.estado, s.id AS supplier_id
        FROM suppliers s
        JOIN companies co ON co.id = s.company_id AND co.deleted_at IS NULL
        LEFT JOIN supplier_scores ss ON ss.supplier_id = s.id
        LEFT JOIN LATERAL (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = co.id ORDER BY ca.is_primary DESC LIMIT 1) addr ON true
        WHERE (p_termo IS NULL OR co.nome_crm ILIKE '%' || p_termo || '%' OR co.cnpj ILIKE '%' || p_termo || '%' OR co.razao_social ILIKE '%' || p_termo || '%')
          AND (p_homologado IS NULL OR s.homologado = p_homologado)
          AND (p_segment_code IS NULL OR ss.segment_code = p_segment_code)
          AND (p_estado IS NULL OR addr.estado = p_estado)
        ORDER BY co.nome_crm
        LIMIT p_limit OFFSET p_offset
      ) t
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_buscar_fornecedores IS 
'Busca flexível de fornecedores com filtros: termo (nome/cnpj), homologado, segmento, estado. Paginação via limit/offset.';
