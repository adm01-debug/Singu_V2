-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260319204343
-- nome:   recreate_vw_suppliers_completo_with_pix

DROP VIEW IF EXISTS public.vw_suppliers_completo;
CREATE VIEW public.vw_suppliers_completo AS
SELECT s.id,
    s.company_id,
    s.categoria,
    s.tipo_fornecedor,
    s.ramo_atividade,
    s.grupo_economico,
    s.produtos,
    s.servicos,
    s.api_url,
    s.tem_integracao,
    s.perfil_preco,
    s.perfil_qualidade,
    s.perfil_prazo,
    s.prazo_entrega_medio,
    s.pedido_minimo,
    s.forma_pagamento,
    s.prazo_pagamento,
    s.spa_data,
    s.created_at,
    s.updated_at,
    co.razao_social,
    co.nome_crm AS company_title,
    co.cnpj,
    co.status AS company_status,
    pix.pix_tipo,
    pix.pix_chave,
    pix.pix_favorecido
FROM suppliers s
JOIN companies co ON co.id = s.company_id
LEFT JOIN LATERAL (
    SELECT p.pix_tipo, p.pix_chave, p.pix_favorecido FROM pix_accounts p
    WHERE p.company_id = s.company_id AND p.is_active = true ORDER BY p.created_at ASC LIMIT 1
) pix ON true;
