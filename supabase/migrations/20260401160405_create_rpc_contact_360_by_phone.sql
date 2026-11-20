-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260401160405
-- nome:   create_rpc_contact_360_by_phone

-- =============================================================
-- RPC: get_contact_360_by_phone
-- Recebe um telefone (qualquer formato) e retorna o 360° completo
-- Busca em contact_phones E company_phones
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_contact_360_by_phone(p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT;
  v_e164 TEXT;
  v_contact_id UUID;
  v_company_id UUID;
  v_result JSONB := '{}'::JSONB;
  v_contact JSONB;
  v_company JSONB;
  v_customer JSONB;
  v_phones JSONB;
  v_emails JSONB;
  v_social JSONB;
  v_interactions JSONB;
  v_rfm JSONB;
  v_stakeholder JSONB;
  v_company_phones JSONB;
  v_company_emails JSONB;
  v_company_addresses JSONB;
  v_company_social JSONB;
BEGIN
  -- ============================
  -- 1. NORMALIZAR TELEFONE
  -- ============================
  v_clean := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Remove leading 55 if present (country code)
  IF length(v_clean) >= 12 AND v_clean LIKE '55%' THEN
    v_clean := substring(v_clean FROM 3);
  END IF;
  
  v_e164 := '+55' || v_clean;
  
  -- ============================
  -- 2. BUSCAR CONTATO POR TELEFONE
  -- ============================
  SELECT cp.contact_id INTO v_contact_id
  FROM contact_phones cp
  WHERE cp.numero_normalizado = v_clean
     OR cp.numero_e164 = v_e164
     OR cp.numero = v_clean
     OR cp.numero = p_phone
  LIMIT 1;
  
  -- Se achou contato, pegar company_id dele
  IF v_contact_id IS NOT NULL THEN
    SELECT c.company_id INTO v_company_id
    FROM contacts c WHERE c.id = v_contact_id;
  END IF;
  
  -- Se não achou contato, tentar via company_phones
  IF v_contact_id IS NULL THEN
    SELECT cph.company_id INTO v_company_id
    FROM company_phones cph
    WHERE cph.numero_normalizado = v_clean
       OR cph.numero_e164 = v_e164
       OR cph.numero = v_clean
       OR cph.numero = p_phone
    LIMIT 1;
    
    -- Se achou empresa, pegar primeiro contato vinculado
    IF v_company_id IS NOT NULL THEN
      SELECT c.id INTO v_contact_id
      FROM contacts c
      WHERE c.company_id = v_company_id
        AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC
      LIMIT 1;
    END IF;
  END IF;
  
  -- Se não achou nada, retornar vazio com flag
  IF v_contact_id IS NULL AND v_company_id IS NULL THEN
    RETURN jsonb_build_object(
      'found', false,
      'searched_phone', p_phone,
      'cleaned_phone', v_clean
    );
  END IF;
  
  -- ============================
  -- 3. DADOS DO CONTATO
  -- ============================
  IF v_contact_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', c.id,
      'first_name', c.first_name,
      'last_name', c.last_name,
      'full_name', c.full_name,
      'nome_tratamento', c.nome_tratamento,
      'apelido', c.apelido,
      'cargo', c.cargo,
      'departamento', c.departamento,
      'cpf', c.cpf,
      'data_nascimento', c.data_nascimento,
      'sexo', c.sexo,
      'relationship_stage', c.relationship_stage,
      'relationship_score', c.relationship_score,
      'sentiment', c.sentiment,
      'tags', c.tags_array,
      'behavior', c.behavior,
      'notes', c.notes,
      'source', c.source,
      'assinatura_contato', c.assinatura_contato,
      'bitrix_contact_id', c.bitrix_contact_id,
      'created_at', c.created_at
    ) INTO v_contact
    FROM contacts c
    WHERE c.id = v_contact_id;
    
    -- Telefones do contato
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'numero', cp.numero,
      'numero_e164', cp.numero_e164,
      'phone_type', cp.phone_type,
      'is_whatsapp', cp.is_whatsapp,
      'is_primary', cp.is_primary
    ) ORDER BY cp.is_primary DESC), '[]'::JSONB)
    INTO v_phones
    FROM contact_phones cp WHERE cp.contact_id = v_contact_id;
    
    -- Emails do contato
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'email', ce.email,
      'email_type', ce.email_type,
      'is_primary', ce.is_primary
    ) ORDER BY ce.is_primary DESC), '[]'::JSONB)
    INTO v_emails
    FROM contact_emails ce WHERE ce.contact_id = v_contact_id;
    
    -- Redes sociais do contato
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'plataforma', cs.plataforma,
      'handle', cs.handle,
      'url', cs.url,
      'nome_perfil', cs.nome_perfil
    )), '[]'::JSONB)
    INTO v_social
    FROM contact_social_media cs 
    WHERE cs.contact_id = v_contact_id AND cs.is_active = true;
    
    -- Últimas 10 interações
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id', i.id,
      'channel', i.channel,
      'direction', i.direction,
      'assunto', i.assunto,
      'resumo', i.resumo,
      'sentiment', i.sentiment,
      'data_interacao', i.data_interacao,
      'type', i.type
    ) ORDER BY i.data_interacao DESC), '[]'::JSONB)
    INTO v_interactions
    FROM (
      SELECT * FROM interactions 
      WHERE contact_id = v_contact_id 
      ORDER BY data_interacao DESC 
      LIMIT 10
    ) i;
    
    -- Stakeholder map (se existir)
    SELECT jsonb_build_object(
      'buying_role', sm.buying_role,
      'power_level', sm.power_level,
      'interest_level', sm.interest_level,
      'stance', sm.stance,
      'engagement_priority', sm.engagement_priority
    ) INTO v_stakeholder
    FROM company_stakeholder_map sm
    WHERE sm.contact_id = v_contact_id
    LIMIT 1;
  END IF;
  
  -- ============================
  -- 4. DADOS DA EMPRESA
  -- ============================
  IF v_company_id IS NOT NULL THEN
    SELECT jsonb_build_object(
      'id', co.id,
      'nome_crm', co.nome_crm,
      'razao_social', co.razao_social,
      'nome_fantasia', co.nome_fantasia,
      'cnpj', co.cnpj,
      'inscricao_estadual', co.inscricao_estadual,
      'website', co.website,
      'ramo_atividade', co.ramo_atividade,
      'status', co.status,
      'logo_url', co.logo_url,
      'cores_marca', co.cores_marca,
      'nicho_cliente', co.nicho_cliente,
      'porte_rf', co.porte_rf,
      'natureza_juridica_desc', co.natureza_juridica_desc,
      'capital_social', co.capital_social,
      'data_fundacao', co.data_fundacao,
      'bitrix_company_id', co.bitrix_company_id
    ) INTO v_company
    FROM companies co WHERE co.id = v_company_id;
    
    -- Dados do cliente (perfil comercial)
    SELECT jsonb_build_object(
      'vendedor_nome', cu.vendedor_nome,
      'sdr_nome', cu.sdr_nome,
      'cliente_ativado', cu.cliente_ativado,
      'ja_comprou', cu.ja_comprou,
      'data_primeira_compra', cu.data_primeira_compra,
      'data_ultima_compra', cu.data_ultima_compra,
      'total_pedidos', cu.total_pedidos,
      'valor_total_compras', cu.valor_total_compras,
      'ticket_medio', cu.ticket_medio,
      'poder_compra', cu.poder_compra,
      'perfil_preco', cu.perfil_preco,
      'perfil_qualidade', cu.perfil_qualidade,
      'perfil_prazo', cu.perfil_prazo,
      'grupo_clientes', cu.grupo_clientes,
      'ramo_atividade', cu.ramo_atividade,
      'data_ativacao', cu.data_ativacao,
      'motivo_inativacao', cu.motivo_inativacao
    ) INTO v_customer
    FROM customers cu 
    WHERE cu.company_id = v_company_id AND cu.deleted_at IS NULL
    LIMIT 1;
    
    -- RFM Score
    SELECT jsonb_build_object(
      'recency_score', r.recency_score,
      'frequency_score', r.frequency_score,
      'monetary_score', r.monetary_score,
      'combined_score', r.combined_score,
      'segment_code', r.segment_code,
      'overall_trend', r.overall_trend,
      'last_interaction_date', r.last_interaction_date
    ) INTO v_rfm
    FROM company_rfm_scores r
    WHERE r.company_id = v_company_id
    ORDER BY r.calculated_at DESC
    LIMIT 1;
    
    -- Telefones da empresa (top 5)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'numero', cph.numero,
      'numero_e164', cph.numero_e164,
      'phone_type', cph.phone_type,
      'is_whatsapp', cph.is_whatsapp,
      'departamento', cph.departamento
    ) ORDER BY cph.is_primary DESC), '[]'::JSONB)
    INTO v_company_phones
    FROM (
      SELECT * FROM company_phones 
      WHERE company_id = v_company_id 
      ORDER BY is_primary DESC, is_whatsapp DESC 
      LIMIT 5
    ) cph;
    
    -- Emails da empresa (top 5)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'email', ce.email,
      'email_type', ce.email_type,
      'departamento', ce.departamento
    ) ORDER BY ce.is_primary DESC), '[]'::JSONB)
    INTO v_company_emails
    FROM (
      SELECT * FROM company_emails 
      WHERE company_id = v_company_id 
      ORDER BY is_primary DESC 
      LIMIT 5
    ) ce;
    
    -- Endereço principal da empresa
    SELECT jsonb_build_object(
      'logradouro', ca.logradouro,
      'numero', ca.numero,
      'complemento', ca.complemento,
      'bairro', ca.bairro,
      'cidade', ca.cidade,
      'estado', ca.estado,
      'cep', ca.cep,
      'latitude', ca.latitude,
      'longitude', ca.longitude
    ) INTO v_company_addresses
    FROM company_addresses ca
    WHERE ca.company_id = v_company_id AND ca.is_primary = true
    LIMIT 1;
    
    -- Se não tem endereço primário, pegar qualquer um
    IF v_company_addresses IS NULL THEN
      SELECT jsonb_build_object(
        'logradouro', ca.logradouro,
        'numero', ca.numero,
        'complemento', ca.complemento,
        'bairro', ca.bairro,
        'cidade', ca.cidade,
        'estado', ca.estado,
        'cep', ca.cep,
        'latitude', ca.latitude,
        'longitude', ca.longitude
      ) INTO v_company_addresses
      FROM company_addresses ca
      WHERE ca.company_id = v_company_id
      LIMIT 1;
    END IF;
    
    -- Redes sociais da empresa (top 5)
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'plataforma', csm.plataforma,
      'handle', csm.handle,
      'url', csm.url,
      'seguidores', csm.seguidores
    )), '[]'::JSONB)
    INTO v_company_social
    FROM (
      SELECT * FROM company_social_media 
      WHERE company_id = v_company_id AND is_active = true 
      ORDER BY seguidores DESC NULLS LAST 
      LIMIT 5
    ) csm;
  END IF;
  
  -- ============================
  -- 5. MONTAR RESULTADO
  -- ============================
  v_result := jsonb_build_object(
    'found', true,
    'searched_phone', p_phone,
    'contact', v_contact,
    'contact_phones', v_phones,
    'contact_emails', v_emails,
    'contact_social', v_social,
    'contact_interactions', v_interactions,
    'stakeholder', v_stakeholder,
    'company', v_company,
    'customer', v_customer,
    'rfm', v_rfm,
    'company_phones', v_company_phones,
    'company_emails', v_company_emails,
    'company_address', v_company_addresses,
    'company_social', v_company_social
  );
  
  RETURN v_result;
END;
$$;

-- Permitir acesso via anon key (para o front-end externo)
GRANT EXECUTE ON FUNCTION public.get_contact_360_by_phone(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_contact_360_by_phone(TEXT) TO authenticated;

COMMENT ON FUNCTION public.get_contact_360_by_phone IS 
'Retorna visão 360° de um contato a partir do telefone. Busca em contact_phones e company_phones, retornando contato, empresa, cliente, RFM, interações, redes sociais, etc.';
