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
