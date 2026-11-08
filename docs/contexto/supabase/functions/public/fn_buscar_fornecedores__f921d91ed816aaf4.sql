CREATE OR REPLACE FUNCTION public.fn_buscar_fornecedores(p_termo text DEFAULT NULL::text, p_homologado boolean DEFAULT NULL::boolean, p_segment_code text DEFAULT NULL::text, p_estado text DEFAULT NULL::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
