-- Description: RPCs de público do Multiplix (ZAPP) — busca, contagem e resolução de
--   destinatários com escopo por permissão. Puramente aditivo: nenhuma tabela, coluna ou
--   função existente é alterada. GRANT restrito a service_role (nunca anon/authenticated) —
--   a única forma de chamar essas funções é via edge function do ZAPP com a chave de serviço,
--   depois de o próprio ZAPP validar o JWT do operador e derivar o escopo (Opção A / GATE C).
-- Author: Claude (sessão Multiplix, ADR-007 do Zapp_Web_V2)
-- Date: 2026-09-26

BEGIN;

-- 1. multiplix_list_ramos — ramos reais (nada inferido pelo nome da empresa)
CREATE OR REPLACE FUNCTION public.multiplix_list_ramos()
RETURNS TABLE(ramo_atividade text, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(NULLIF(trim(c.ramo_atividade), ''), 'Não informado') AS ramo_atividade,
         count(*)::bigint AS total
  FROM public.companies c
  WHERE c.deleted_at IS NULL AND c.status = 'ativo'
  GROUP BY 1
  ORDER BY total DESC;
$$;

-- 2. multiplix_list_ufs — UF do endereço primário
CREATE OR REPLACE FUNCTION public.multiplix_list_ufs()
RETURNS TABLE(uf text, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ca.estado AS uf, count(DISTINCT ca.company_id)::bigint AS total
  FROM public.company_addresses ca
  JOIN public.companies c ON c.id = ca.company_id
  WHERE ca.is_primary = true AND ca.estado IS NOT NULL
    AND c.deleted_at IS NULL AND c.status = 'ativo'
  GROUP BY 1
  ORDER BY total DESC;
$$;

-- 3. multiplix_search_audience — lista paginada com escopo aplicado no servidor.
--    p_scope_permissions vem do edge function do ZAPP (nunca do navegador): subconjunto de
--    {'admin','suppliers','carriers','customers_all','customers_own'}. 'customers_own' exige
--    p_scope_vendedor_email = e-mail do operador ZAPP autenticado; o vínculo com o vendedor do
--    Singu é feito por e-mail (public.users.email), não por ID — os dois projetos têm auth.users
--    próprios e independentes, e companies.user_id não corresponde a nenhum dos dois (achado
--    desta sessão: 3.833 linhas com user_id preenchido, 0 batem com auth.users). A carteira real
--    já existe na tabela public.customers (customers.vendedor_id -> public.users.id).
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
      COALESCE(cp.numero_e164, cpr.whatsapp, cph.numero_e164) AS destino_e164,
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
    d.uf_primaria,
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

-- 4. multiplix_count_audience — total autoritativo, mesma regra de escopo/filtro acima,
--    sem paginação nem resolução de destino (mais barato para "selecionar todos os N").
CREATE OR REPLACE FUNCTION public.multiplix_count_audience(
  p_roles text[] DEFAULT NULL,
  p_ramo text DEFAULT NULL,
  p_uf text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_scope_permissions text[] DEFAULT ARRAY[]::text[],
  p_scope_vendedor_email text DEFAULT NULL
)
RETURNS bigint
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_admin boolean := 'admin' = ANY(p_scope_permissions);
  v_vendedor_user_id integer;
  v_total bigint;
BEGIN
  IF NOT v_is_admin AND 'customers_own' = ANY(p_scope_permissions) AND p_scope_vendedor_email IS NOT NULL THEN
    SELECT u.id INTO v_vendedor_user_id
    FROM public.users u
    WHERE lower(u.email) = lower(p_scope_vendedor_email) AND u.is_vendedor = true AND u.is_active = true;
  END IF;

  SELECT count(*) INTO v_total
  FROM public.companies c
  LEFT JOIN public.company_addresses ca ON ca.company_id = c.id AND ca.is_primary = true
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
    AND (p_roles IS NULL OR cardinality(p_roles) = 0
      OR ('cliente' = ANY(p_roles) AND c.is_customer)
      OR ('fornecedor' = ANY(p_roles) AND c.is_supplier)
      OR ('transportadora' = ANY(p_roles) AND c.is_carrier))
    AND (p_ramo IS NULL
      OR c.ramo_atividade = p_ramo
      OR (p_ramo = 'Não informado' AND (c.ramo_atividade IS NULL OR trim(c.ramo_atividade) = '')))
    AND (p_search IS NULL OR trim(p_search) = '' OR c.search_vector @@ plainto_tsquery('portuguese', p_search))
    AND (p_uf IS NULL OR ca.estado = p_uf);

  RETURN v_total;
END;
$$;

-- 5. multiplix_resolve_recipients — dado um conjunto explícito de company_ids/contact_ids
--    (seleção manual do operador), revalida o escopo e resolve o destino final de cada um.
--    Um company_id fora do escopo do chamador volta com motivo 'fora_do_escopo' e destino nulo
--    — nunca vaza o destino, só a classificação (E007/E015: nunca confiar em filtro do cliente).
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
    -- contact_id explícito quando o operador pediu um contato específico daquela empresa;
    -- senão o contato principal (mesma regra do search_audience).
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
      COALESCE(cp.numero_e164, ct.whatsapp, cph.numero_e164) AS destino_e164,
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

-- GRANTs: só service_role. Nunca anon, nunca authenticated — diferente das 5 RPCs antigas do
-- GATE C (docs/crm-external-grants.md no Zapp_Web_V2), que ficaram abertas para anon por
-- necessidade histórica. Aqui a chamada só existe via edge function do ZAPP com a chave de
-- serviço (Opção A da ADR-007), então o grant restrito É o controle de acesso — não há
-- verificação de auth.jwt() dentro da função porque não há JWT de usuário nessa chamada
-- servidor-a-servidor entre dois projetos Supabase distintos.
REVOKE ALL ON FUNCTION public.multiplix_list_ramos() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.multiplix_list_ufs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.multiplix_search_audience(text[], text, text, text, text[], text, int, int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.multiplix_count_audience(text[], text, text, text, text[], text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.multiplix_resolve_recipients(uuid[], uuid[], text[], text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.multiplix_list_ramos() TO service_role;
GRANT EXECUTE ON FUNCTION public.multiplix_list_ufs() TO service_role;
GRANT EXECUTE ON FUNCTION public.multiplix_search_audience(text[], text, text, text, text[], text, int, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.multiplix_count_audience(text[], text, text, text, text[], text) TO service_role;
GRANT EXECUTE ON FUNCTION public.multiplix_resolve_recipients(uuid[], uuid[], text[], text) TO service_role;

COMMIT;

-- DOWN MIGRATION (Rollback)
/*
BEGIN;
DROP FUNCTION IF EXISTS public.multiplix_resolve_recipients(uuid[], uuid[], text[], text);
DROP FUNCTION IF EXISTS public.multiplix_count_audience(text[], text, text, text, text[], text);
DROP FUNCTION IF EXISTS public.multiplix_search_audience(text[], text, text, text, text[], text, int, int);
DROP FUNCTION IF EXISTS public.multiplix_list_ufs();
DROP FUNCTION IF EXISTS public.multiplix_list_ramos();
COMMIT;
*/
