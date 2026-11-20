-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260401161054
-- nome:   create_rpc_search_contacts_advanced

-- =============================================================
-- RPC: search_contacts_advanced
-- Busca avançada de contatos com filtros por empresa, vendedor,
-- ramo, segmento RFM, estado, status e texto livre.
-- Retorna resultado paginado com dados resumidos para lista.
-- =============================================================
CREATE OR REPLACE FUNCTION public.search_contacts_advanced(
  p_search TEXT DEFAULT NULL,
  p_vendedor TEXT DEFAULT NULL,
  p_ramo TEXT DEFAULT NULL,
  p_rfm_segment TEXT DEFAULT NULL,
  p_estado TEXT DEFAULT NULL,
  p_cliente_ativado BOOLEAN DEFAULT NULL,
  p_ja_comprou BOOLEAN DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'relevance',
  p_page INT DEFAULT 0,
  p_page_size INT DEFAULT 25
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offset INT := p_page * p_page_size;
  v_tsquery tsquery;
  v_results JSONB;
  v_total INT;
  v_filters JSONB;
BEGIN
  -- Build tsquery if search text provided
  IF p_search IS NOT NULL AND trim(p_search) != '' THEN
    v_tsquery := plainto_tsquery('portuguese', trim(p_search));
  END IF;

  -- Count total matching
  SELECT COUNT(DISTINCT c.id) INTO v_total
  FROM contacts c
  LEFT JOIN companies co ON co.id = c.company_id
  LEFT JOIN customers cu ON cu.company_id = c.company_id AND cu.deleted_at IS NULL
  LEFT JOIN company_rfm_scores rfm ON rfm.company_id = c.company_id
  LEFT JOIN company_addresses ca ON ca.company_id = c.company_id AND ca.is_primary = true
  WHERE c.deleted_at IS NULL
    AND (v_tsquery IS NULL OR (
      c.search_vector @@ v_tsquery 
      OR co.search_vector @@ v_tsquery
    ))
    AND (p_vendedor IS NULL OR cu.vendedor_nome = p_vendedor)
    AND (p_ramo IS NULL OR cu.ramo_atividade ILIKE '%' || p_ramo || '%')
    AND (p_rfm_segment IS NULL OR rfm.segment_code = p_rfm_segment)
    AND (p_estado IS NULL OR ca.estado = p_estado)
    AND (p_cliente_ativado IS NULL OR cu.cliente_ativado = p_cliente_ativado)
    AND (p_ja_comprou IS NULL OR cu.ja_comprou = p_ja_comprou);

  -- Fetch paginated results
  SELECT COALESCE(jsonb_agg(row_data ORDER BY sort_key DESC NULLS LAST), '[]'::JSONB)
  INTO v_results
  FROM (
    SELECT DISTINCT ON (c.id)
      jsonb_build_object(
        'contact_id', c.id,
        'full_name', c.full_name,
        'nome_tratamento', c.nome_tratamento,
        'apelido', c.apelido,
        'cargo', c.cargo,
        'departamento', c.departamento,
        'relationship_score', c.relationship_score,
        'relationship_stage', c.relationship_stage,
        'sentiment', c.sentiment,
        'tags', c.tags_array,
        'company_id', co.id,
        'company_name', COALESCE(co.nome_fantasia, co.nome_crm, co.razao_social),
        'company_cnpj', co.cnpj,
        'company_logo', co.logo_url,
        'company_ramo', co.ramo_atividade,
        'company_status', co.status,
        'company_estado', ca.estado,
        'company_cidade', ca.cidade,
        'vendedor_nome', cu.vendedor_nome,
        'cliente_ativado', cu.cliente_ativado,
        'ja_comprou', cu.ja_comprou,
        'total_pedidos', cu.total_pedidos,
        'valor_total_compras', cu.valor_total_compras,
        'ticket_medio', cu.ticket_medio,
        'rfm_segment', rfm.segment_code,
        'rfm_score', rfm.combined_score,
        'phone_primary', (
          SELECT cp.numero_e164 
          FROM contact_phones cp 
          WHERE cp.contact_id = c.id 
          ORDER BY cp.is_primary DESC, cp.is_whatsapp DESC 
          LIMIT 1
        ),
        'email_primary', (
          SELECT ce.email 
          FROM contact_emails ce 
          WHERE ce.contact_id = c.id 
          ORDER BY ce.is_primary DESC 
          LIMIT 1
        ),
        'is_whatsapp', EXISTS(
          SELECT 1 FROM contact_phones cp 
          WHERE cp.contact_id = c.id AND cp.is_whatsapp = true
        )
      ) AS row_data,
      CASE p_sort_by
        WHEN 'relevance' THEN 
          CASE WHEN v_tsquery IS NOT NULL 
            THEN ts_rank(COALESCE(c.search_vector, ''::tsvector), v_tsquery)::NUMERIC
            ELSE c.relationship_score::NUMERIC
          END
        WHEN 'name' THEN 0
        WHEN 'score' THEN c.relationship_score::NUMERIC
        WHEN 'compras' THEN COALESCE(cu.valor_total_compras, 0)::NUMERIC
        WHEN 'pedidos' THEN COALESCE(cu.total_pedidos, 0)::NUMERIC
        WHEN 'recent' THEN EXTRACT(EPOCH FROM c.created_at)::NUMERIC
        ELSE c.relationship_score::NUMERIC
      END AS sort_key
    FROM contacts c
    LEFT JOIN companies co ON co.id = c.company_id
    LEFT JOIN customers cu ON cu.company_id = c.company_id AND cu.deleted_at IS NULL
    LEFT JOIN company_rfm_scores rfm ON rfm.company_id = c.company_id
    LEFT JOIN company_addresses ca ON ca.company_id = c.company_id AND ca.is_primary = true
    WHERE c.deleted_at IS NULL
      AND (v_tsquery IS NULL OR (
        c.search_vector @@ v_tsquery 
        OR co.search_vector @@ v_tsquery
      ))
      AND (p_vendedor IS NULL OR cu.vendedor_nome = p_vendedor)
      AND (p_ramo IS NULL OR cu.ramo_atividade ILIKE '%' || p_ramo || '%')
      AND (p_rfm_segment IS NULL OR rfm.segment_code = p_rfm_segment)
      AND (p_estado IS NULL OR ca.estado = p_estado)
      AND (p_cliente_ativado IS NULL OR cu.cliente_ativado = p_cliente_ativado)
      AND (p_ja_comprou IS NULL OR cu.ja_comprou = p_ja_comprou)
    LIMIT p_page_size
    OFFSET v_offset
  ) sub;

  -- Build filter options (only on first page to save CPU)
  IF p_page = 0 THEN
    SELECT jsonb_build_object(
      'vendedores', (
        SELECT COALESCE(jsonb_agg(DISTINCT cu2.vendedor_nome ORDER BY cu2.vendedor_nome), '[]'::JSONB)
        FROM customers cu2 WHERE cu2.vendedor_nome IS NOT NULL AND cu2.deleted_at IS NULL
      ),
      'ramos', (
        SELECT COALESCE(jsonb_agg(DISTINCT cu2.ramo_atividade ORDER BY cu2.ramo_atividade), '[]'::JSONB)
        FROM customers cu2 WHERE cu2.ramo_atividade IS NOT NULL AND cu2.deleted_at IS NULL
      ),
      'rfm_segments', (
        SELECT COALESCE(jsonb_agg(DISTINCT rfm2.segment_code ORDER BY rfm2.segment_code), '[]'::JSONB)
        FROM company_rfm_scores rfm2 WHERE rfm2.segment_code IS NOT NULL
      ),
      'estados', (
        SELECT COALESCE(jsonb_agg(DISTINCT ca2.estado ORDER BY ca2.estado), '[]'::JSONB)
        FROM company_addresses ca2 WHERE ca2.estado IS NOT NULL AND ca2.is_primary = true
      )
    ) INTO v_filters;
  END IF;

  RETURN jsonb_build_object(
    'results', v_results,
    'total', v_total,
    'page', p_page,
    'page_size', p_page_size,
    'total_pages', CEIL(v_total::NUMERIC / p_page_size),
    'filters', COALESCE(v_filters, NULL)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_contacts_advanced(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, INT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.search_contacts_advanced(TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, TEXT, INT, INT) TO authenticated;

COMMENT ON FUNCTION public.search_contacts_advanced IS 
'Busca avançada de contatos com filtros multi-dimensionais. Retorna contatos paginados com dados de empresa, cliente, RFM e telefone/email principal. Na página 0 retorna também as opções de filtro disponíveis.';
