-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260319204303
-- nome:   recreate_views_suppliers_carriers_with_pix

-- Drop e recria views com colunas PIX

DROP VIEW IF EXISTS public.vw_suppliers;
CREATE VIEW public.vw_suppliers AS
SELECT c.id,
    c.bitrix_company_id,
    c.nome_crm AS title,
    c.cnpj,
    ( SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary = true LIMIT 1) AS phone,
    ( SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary = true LIMIT 1) AS email,
    addr.cidade,
    addr.estado,
    s.categoria,
    s.tipo_fornecedor,
    s.tem_integracao,
    s.perfil_preco,
    pix.pix_tipo,
    pix.pix_chave,
    pix.pix_favorecido,
    c.created_at
FROM companies c
JOIN suppliers s ON s.company_id = c.id
LEFT JOIN LATERAL (
    SELECT ca.cidade, ca.estado FROM company_addresses ca
    WHERE ca.company_id = c.id ORDER BY ca.is_primary DESC LIMIT 1
) addr ON true
LEFT JOIN LATERAL (
    SELECT p.pix_tipo, p.pix_chave, p.pix_favorecido FROM pix_accounts p
    WHERE p.company_id = c.id AND p.is_active = true ORDER BY p.created_at ASC LIMIT 1
) pix ON true
WHERE c.deleted_at IS NULL AND c.is_supplier = true;

DROP VIEW IF EXISTS public.vw_carriers;
CREATE VIEW public.vw_carriers AS
SELECT c.id,
    c.bitrix_company_id,
    c.nome_crm AS title,
    c.cnpj,
    ( SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary = true LIMIT 1) AS phone,
    addr.cidade,
    addr.estado,
    ca2.tipo_transporte,
    ca2.transportadora_validada,
    ca2.ultimo_transporte,
    pix.pix_tipo,
    pix.pix_chave,
    pix.pix_favorecido,
    c.created_at
FROM companies c
JOIN carriers ca2 ON ca2.company_id = c.id
LEFT JOIN LATERAL (
    SELECT ca.cidade, ca.estado FROM company_addresses ca
    WHERE ca.company_id = c.id ORDER BY ca.is_primary DESC LIMIT 1
) addr ON true
LEFT JOIN LATERAL (
    SELECT p.pix_tipo, p.pix_chave, p.pix_favorecido FROM pix_accounts p
    WHERE p.company_id = c.id AND p.is_active = true ORDER BY p.created_at ASC LIMIT 1
) pix ON true
WHERE c.deleted_at IS NULL AND c.is_carrier = true;
