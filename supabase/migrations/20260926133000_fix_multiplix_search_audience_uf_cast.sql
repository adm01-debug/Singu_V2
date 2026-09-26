-- Description: Corrige multiplix_search_audience — RETURN QUERY (plpgsql) exige tipo exato
--   contra RETURNS TABLE. Duas colunas vazam varchar em vez de text: (1) uf, de
--   company_addresses.estado (varchar(2)); (2) destino_e164, do COALESCE entre
--   contact_phones.numero_e164/company_phones.numero_e164 (varchar(20)) e contacts.whatsapp
--   (text) — o COALESCE nao promove sozinho pra text quando os tres braços nao sao todos do
--   mesmo tipo exato. list_ramos/list_ufs (LANGUAGE sql) nao sofrem disso porque a coercao de
--   uma funcao SQL e mais permissiva; search_audience (plpgsql) falhava com 42804 em QUALQUER
--   chamada que retornasse linhas (achado ao testar a RPC ja aplicada em producao,
--   supabase/migrations/20260926120000_multiplix_audience_rpcs.sql — a 1a rodada deste fix so
--   pegou a coluna uf e ainda quebrava na coluna destino_e164). Puramente aditivo/corretivo: so
--   os casts no SELECT final mudam; assinatura, grants e demais funcoes ficam identicas.
-- Author: Claude (sessao Multiplix, achado ao integrar a edge multiplix-audience do ZAPP)
-- Date: 2026-09-26

BEGIN;

CREATE OR REPLACE FUNCTION public.multiplix_search_audience(
  p_roles text[] DEFAULT NULL,
  p_ramo text DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_scope_permissions text[] DEFAULT ARRAY[]::text[],
  p_scope_vendedor_email text DEFAULT NULL,
  p_page int DEFAULT 0,
  p_page_size int DEFAULT 50
)
RETURNS TABLE(
  company_id uuid,
  company_name text,
  ramo_atividade text,
  uf text,
  is_customer boolean,
  is_supplier boolean,
  is_carrier boolean,
  destino_e164 text,
  destino_origem text,
  motivo_inclusao text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_admin boolean := 'admin' = ANY(p_scope_permissions);
  v_vendedor_user_id integer;
BEGIN
  IF NOT v_is_admin AND 'customers_own' = ANY(p_scope_permissions) AND p_scope_vendedor_email IS NOT NULL THEN
    SELECT u.id INTO v_vendedor_user_id
    FROM public.users u
    WHERE lower(u.email) = lower(p_scope_vendedor_email) AND u.is_vendedor = true AND u.is_active = true;
  END IF;

  RETURN QUERY
  WITH escopo AS (
    SELECT c.id
    FROM public.companies c
    WHERE c.deleted_at IS NULL AND c.status = 'ativo'
      AND (
        v_is_admin
        OR (c.is_supplier AND 'suppliers' = ANY(p_scope_permissions))
        OR (c.is_carrier AND 'carriers' = ANY(p_scope_permissions))
        OR (c.is_customer AND 'customers_all' = ANY(p_scope_permissions))
        OR (c.is_customer AND v_vendedor_user_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM public.customers cu
              WHERE cu.company_id = c.id AND cu.vendedor_id = v_vendedor_user_id
            ))
      )
  ),
  filtrado AS (
    SELECT c.*
    FROM public.companies c
    JOIN escopo e ON e.id = c.id
    WHERE
      (p_roles IS NULL OR cardinality(p_roles) = 0
        OR ('cliente' = ANY(p_roles) AND c.is_customer)
        OR ('fornecedor' = ANY(p_roles) AND c.is_supplier)
        OR ('transportadora' = ANY(p_roles) AND c.is_carrier))
      AND (p_ramo IS NULL
        OR c.ramo_atividade = p_ramo
        OR (p_ramo = 'Não informado' AND (c.ramo_atividade IS NULL OR trim(c.ramo_atividade) = '')))
      AND (p_search IS NULL OR trim(p_search) = '' OR c.search_vector @@ plainto_tsquery('portuguese', p_search))
  ),
  com_endereco AS (
    SELECT f.*, ca.estado AS uf_primaria
    FROM filtrado f
    LEFT JOIN public.company_addresses ca ON ca.company_id = f.id AND ca.is_primary = true
    WHERE p_uf IS NULL OR ca.estado = p_uf
  ),
  contato_principal AS (
    SELECT DISTINCT ON (ct.company_id) ct.id, ct.company_id, ct.whatsapp
    FROM public.contacts ct
    WHERE ct.deleted_at IS NULL AND ct.is_duplicate = false
    ORDER BY ct.company_id, ct.created_at ASC
  ),
  destino AS (
    SELECT
      ce.*,
      COALESCE(cp.numero_e164::text, cpr.whatsapp, cph.numero_e164::text) AS destino_e164,
      CASE
        WHEN cp.numero_e164 IS NOT NULL OR cpr.whatsapp IS NOT NULL THEN 'contato_pessoa'
        WHEN cph.numero_e164 IS NOT NULL THEN 'telefone_empresa'
        ELSE 'sem_destino'
      END AS destino_origem
    FROM com_endereco ce
    LEFT JOIN contato_principal cpr ON cpr.company_id = ce.id
    LEFT JOIN LATERAL (
      SELECT cp.numero_e164 FROM public.contact_phones cp
      WHERE cp.contact_id = cpr.id AND cp.is_whatsapp = true
      ORDER BY cp.is_primary DESC LIMIT 1
    ) cp ON true
    LEFT JOIN LATERAL (
      SELECT cph.numero_e164 FROM public.company_phones cph
      WHERE cph.company_id = ce.id AND cph.is_whatsapp = true
      ORDER BY cph.is_primary DESC LIMIT 1
    ) cph ON true
  )
  SELECT
    d.id,
    COALESCE(NULLIF(trim(d.name), ''), d.nome_crm),
    COALESCE(NULLIF(trim(d.ramo_atividade), ''), 'Não informado'),
    d.uf_primaria::text,
    d.is_customer, d.is_supplier, d.is_carrier,
    d.destino_e164,
    d.destino_origem,
    CASE
      WHEN v_is_admin THEN 'escopo: admin'
      WHEN d.is_supplier AND 'suppliers' = ANY(p_scope_permissions) THEN 'escopo: fornecedor'
      WHEN d.is_carrier AND 'carriers' = ANY(p_scope_permissions) THEN 'escopo: transportadora'
      WHEN d.is_customer AND 'customers_all' = ANY(p_scope_permissions) THEN 'escopo: cliente (todos)'
      ELSE 'escopo: carteira do vendedor'
    END
  FROM destino d
  ORDER BY d.nome_crm
  OFFSET p_page * p_page_size LIMIT p_page_size;
END;
$$;

REVOKE ALL ON FUNCTION public.multiplix_search_audience(text[], text, text, text, text[], text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.multiplix_search_audience(text[], text, text, text, text[], text, int, int) TO service_role;

-- Mesmo bug (COALESCE varchar/text), mesma causa raiz, em multiplix_resolve_recipients —
-- achado ao testar essa RPC tambem antes de fechar este fix (destino_e164, coluna 4).
CREATE OR REPLACE FUNCTION public.multiplix_resolve_recipients(
  p_company_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_contact_ids uuid[] DEFAULT ARRAY[]::uuid[],
  p_scope_permissions text[] DEFAULT ARRAY[]::text[],
  p_scope_vendedor_email text DEFAULT NULL
)
RETURNS TABLE(
  company_id uuid,
  contact_id uuid,
  company_name text,
  destino_e164 text,
  destino_origem text,
  elegibilidade text
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_admin boolean := 'admin' = ANY(p_scope_permissions);
  v_vendedor_user_id integer;
BEGIN
  IF NOT v_is_admin AND 'customers_own' = ANY(p_scope_permissions) AND p_scope_vendedor_email IS NOT NULL THEN
    SELECT u.id INTO v_vendedor_user_id
    FROM public.users u
    WHERE lower(u.email) = lower(p_scope_vendedor_email) AND u.is_vendedor = true AND u.is_active = true;
  END IF;

  RETURN QUERY
  WITH alvo AS (
    SELECT DISTINCT c.id AS company_id
    FROM public.companies c
    WHERE c.id = ANY(p_company_ids)
    UNION
    SELECT DISTINCT ct.company_id
    FROM public.contacts ct
    WHERE ct.id = ANY(p_contact_ids) AND ct.company_id IS NOT NULL
  ),
  avaliado AS (
    SELECT
      c.id AS company_id,
      COALESCE(NULLIF(trim(c.name), ''), c.nome_crm) AS company_name,
      (c.deleted_at IS NULL AND c.status = 'ativo') AS ativa,
      (
        v_is_admin
        OR (c.is_supplier AND 'suppliers' = ANY(p_scope_permissions))
        OR (c.is_carrier AND 'carriers' = ANY(p_scope_permissions))
        OR (c.is_customer AND 'customers_all' = ANY(p_scope_permissions))
        OR (c.is_customer AND v_vendedor_user_id IS NOT NULL AND EXISTS (
              SELECT 1 FROM public.customers cu
              WHERE cu.company_id = c.id AND cu.vendedor_id = v_vendedor_user_id
            ))
      ) AS no_escopo
    FROM public.companies c
    JOIN alvo a ON a.company_id = c.id
  ),
  contato_escolhido AS (
    SELECT
      av.company_id,
      COALESCE(
        (SELECT ct.id FROM public.contacts ct WHERE ct.id = ANY(p_contact_ids) AND ct.company_id = av.company_id AND ct.deleted_at IS NULL AND ct.is_duplicate = false LIMIT 1),
        (SELECT ct.id FROM public.contacts ct WHERE ct.company_id = av.company_id AND ct.deleted_at IS NULL AND ct.is_duplicate = false ORDER BY ct.created_at ASC LIMIT 1)
      ) AS contact_id
    FROM avaliado av
  ),
  destino AS (
    SELECT
      av.company_id, av.company_name, av.ativa, av.no_escopo, ce.contact_id,
      ct.whatsapp AS contato_whatsapp,
      COALESCE(cp.numero_e164::text, ct.whatsapp, cph.numero_e164::text) AS destino_e164,
      CASE
        WHEN cp.numero_e164 IS NOT NULL OR ct.whatsapp IS NOT NULL THEN 'contato_pessoa'
        WHEN cph.numero_e164 IS NOT NULL THEN 'telefone_empresa'
        ELSE 'sem_destino'
      END AS destino_origem
    FROM avaliado av
    JOIN contato_escolhido ce ON ce.company_id = av.company_id
    LEFT JOIN public.contacts ct ON ct.id = ce.contact_id
    LEFT JOIN LATERAL (
      SELECT cp.numero_e164 FROM public.contact_phones cp
      WHERE cp.contact_id = ct.id AND cp.is_whatsapp = true
      ORDER BY cp.is_primary DESC LIMIT 1
    ) cp ON true
    LEFT JOIN LATERAL (
      SELECT cph.numero_e164 FROM public.company_phones cph
      WHERE cph.company_id = av.company_id AND cph.is_whatsapp = true
      ORDER BY cph.is_primary DESC LIMIT 1
    ) cph ON true
  )
  SELECT
    d.company_id, d.contact_id, d.company_name,
    CASE WHEN d.no_escopo AND d.ativa THEN d.destino_e164 ELSE NULL END,
    CASE WHEN d.no_escopo AND d.ativa THEN d.destino_origem ELSE NULL END,
    CASE
      WHEN NOT d.ativa THEN 'destino_invalido'
      WHEN NOT d.no_escopo THEN 'fora_do_escopo'
      WHEN d.destino_e164 IS NULL THEN 'destino_invalido'
      ELSE 'apto'
    END
  FROM destino d;
END;
$$;

REVOKE ALL ON FUNCTION public.multiplix_resolve_recipients(uuid[], uuid[], text[], text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.multiplix_resolve_recipients(uuid[], uuid[], text[], text) TO service_role;

COMMIT;

-- DOWN MIGRATION (Rollback)
/*
BEGIN;
-- Reverte para a versao com o bug (nao recomendado); ver
-- 20260926120000_multiplix_audience_rpcs.sql para o corpo anterior.
COMMIT;
*/
