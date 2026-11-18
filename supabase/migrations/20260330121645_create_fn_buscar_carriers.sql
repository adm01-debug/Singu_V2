-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121645
-- nome:   create_fn_buscar_carriers

CREATE OR REPLACE FUNCTION fn_buscar_carriers(
  p_termo text DEFAULT NULL,
  p_homologado boolean DEFAULT NULL,
  p_segment_code text DEFAULT NULL,
  p_estado text DEFAULT NULL,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total', (
      SELECT COUNT(*) FROM carriers c
      JOIN companies co ON co.id = c.company_id AND co.deleted_at IS NULL
      LEFT JOIN carrier_scores cs ON cs.carrier_id = c.id
      LEFT JOIN LATERAL (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = co.id ORDER BY ca.is_primary DESC LIMIT 1) addr ON true
      WHERE (p_termo IS NULL OR co.nome_crm ILIKE '%' || p_termo || '%' OR co.cnpj ILIKE '%' || p_termo || '%' OR co.razao_social ILIKE '%' || p_termo || '%')
        AND (p_homologado IS NULL OR c.homologado = p_homologado)
        AND (p_segment_code IS NULL OR cs.segment_code = p_segment_code)
        AND (p_estado IS NULL OR addr.estado = p_estado)
    ),
    'results', COALESCE((
      SELECT json_agg(row_to_json(t)) FROM (
        SELECT co.nome_crm AS transportadora, co.cnpj, c.homologado, c.score_geral,
          cs.classificacao, cs.segment_code, cs.trend, cs.total_avaliacoes,
          addr.estado, c.id AS carrier_id
        FROM carriers c
        JOIN companies co ON co.id = c.company_id AND co.deleted_at IS NULL
        LEFT JOIN carrier_scores cs ON cs.carrier_id = c.id
        LEFT JOIN LATERAL (SELECT ca.estado FROM company_addresses ca WHERE ca.company_id = co.id ORDER BY ca.is_primary DESC LIMIT 1) addr ON true
        WHERE (p_termo IS NULL OR co.nome_crm ILIKE '%' || p_termo || '%' OR co.cnpj ILIKE '%' || p_termo || '%' OR co.razao_social ILIKE '%' || p_termo || '%')
          AND (p_homologado IS NULL OR c.homologado = p_homologado)
          AND (p_segment_code IS NULL OR cs.segment_code = p_segment_code)
          AND (p_estado IS NULL OR addr.estado = p_estado)
        ORDER BY co.nome_crm
        LIMIT p_limit OFFSET p_offset
      ) t
    ), '[]'::json)
  ) INTO v_result;

  RETURN v_result;
END;
$function$;

COMMENT ON FUNCTION fn_buscar_carriers(text, boolean, text, text, integer, integer) IS 'Busca transportadoras com filtros (termo, homologação, segmento, estado) e paginação.';
