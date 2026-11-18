-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260401174211
-- nome:   create_rpc_batch_company_by_phones

-- =============================================================
-- RPC: get_companies_by_phones_batch
-- Recebe um array de telefones e retorna company_name + rfm
-- para cada um que for encontrado. Uma única query no lugar de N.
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_companies_by_phones_batch(p_phones TEXT[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB := '{}'::JSONB;
BEGIN
  -- Build a map: cleaned_phone -> { company_name, rfm_segment, vendedor, cliente_ativado }
  WITH cleaned AS (
    SELECT 
      raw_phone,
      regexp_replace(
        CASE 
          WHEN length(regexp_replace(raw_phone, '[^0-9]', '', 'g')) >= 12 
               AND regexp_replace(raw_phone, '[^0-9]', '', 'g') LIKE '55%'
          THEN substring(regexp_replace(raw_phone, '[^0-9]', '', 'g') FROM 3)
          ELSE regexp_replace(raw_phone, '[^0-9]', '', 'g')
        END,
        '[^0-9]', '', 'g'
      ) AS clean
    FROM unnest(p_phones) AS raw_phone
  ),
  -- Match via contact_phones
  contact_matches AS (
    SELECT DISTINCT ON (cl.raw_phone)
      cl.raw_phone,
      c.company_id
    FROM cleaned cl
    JOIN contact_phones cp ON (
      cp.numero_normalizado = cl.clean 
      OR cp.numero_e164 = '+55' || cl.clean
      OR cp.numero = cl.clean
    )
    JOIN contacts c ON c.id = cp.contact_id AND c.deleted_at IS NULL
    WHERE c.company_id IS NOT NULL
  ),
  -- Match via company_phones (fallback)
  company_matches AS (
    SELECT DISTINCT ON (cl.raw_phone)
      cl.raw_phone,
      cph.company_id
    FROM cleaned cl
    LEFT JOIN contact_matches cm ON cm.raw_phone = cl.raw_phone
    JOIN company_phones cph ON (
      cph.numero_normalizado = cl.clean
      OR cph.numero_e164 = '+55' || cl.clean
      OR cph.numero = cl.clean
    )
    WHERE cm.raw_phone IS NULL -- only for phones not already matched
  ),
  -- Union all matches
  all_matches AS (
    SELECT raw_phone, company_id FROM contact_matches
    UNION ALL
    SELECT raw_phone, company_id FROM company_matches
  ),
  -- Enrich with company + customer + rfm
  enriched AS (
    SELECT DISTINCT ON (am.raw_phone)
      am.raw_phone,
      COALESCE(co.nome_fantasia, co.nome_crm, co.razao_social) AS company_name,
      co.logo_url,
      cu.vendedor_nome,
      cu.cliente_ativado,
      cu.total_pedidos,
      cu.valor_total_compras,
      rfm.segment_code AS rfm_segment,
      rfm.combined_score AS rfm_score
    FROM all_matches am
    JOIN companies co ON co.id = am.company_id
    LEFT JOIN customers cu ON cu.company_id = am.company_id AND cu.deleted_at IS NULL
    LEFT JOIN company_rfm_scores rfm ON rfm.company_id = am.company_id
    ORDER BY am.raw_phone, cu.created_at ASC
  )
  SELECT COALESCE(
    jsonb_object_agg(
      e.raw_phone,
      jsonb_build_object(
        'company_name', e.company_name,
        'logo_url', e.logo_url,
        'vendedor_nome', e.vendedor_nome,
        'cliente_ativado', e.cliente_ativado,
        'total_pedidos', e.total_pedidos,
        'valor_total_compras', e.valor_total_compras,
        'rfm_segment', e.rfm_segment,
        'rfm_score', e.rfm_score
      )
    ),
    '{}'::JSONB
  ) INTO v_result
  FROM enriched e;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_companies_by_phones_batch(TEXT[]) TO anon;
GRANT EXECUTE ON FUNCTION public.get_companies_by_phones_batch(TEXT[]) TO authenticated;

COMMENT ON FUNCTION public.get_companies_by_phones_batch IS 
'Batch lookup: recebe array de telefones, retorna mapa phone→{company_name, logo, vendedor, rfm} em uma única query. Otimizado para ConversationList.';
