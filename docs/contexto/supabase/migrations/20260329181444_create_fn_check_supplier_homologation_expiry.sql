CREATE OR REPLACE FUNCTION fn_check_supplier_homologation_expiry()
RETURNS JSON AS $$
DECLARE
  v_vencidas INTEGER := 0;
  v_vencendo INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- 1. Marcar homologações vencidas
  FOR v_rec IN
    SELECT sh.id AS hom_id, sh.supplier_id, s.company_id, co.nome_crm
    FROM supplier_homologations sh
    JOIN suppliers s ON s.id = sh.supplier_id
    JOIN companies co ON co.id = s.company_id
    WHERE sh.status = 'homologado'
      AND sh.validade < CURRENT_DATE
  LOOP
    -- Atualizar status para vencido
    UPDATE supplier_homologations SET status = 'vencido' WHERE id = v_rec.hom_id;

    -- Gerar alerta na tabela alerts
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_rec.company_id,
      'supplier_homologacao_vencida',
      'urgent',
      'Homologação Vencida: ' || v_rec.nome_crm,
      'A homologação do fornecedor ' || v_rec.nome_crm || ' venceu. Necessário reavaliar antes de novos pedidos.',
      'active',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'homologation_id', v_rec.hom_id),
      NOW(), NOW()
    );

    v_vencidas := v_vencidas + 1;
  END LOOP;

  -- 2. Alertar homologações vencendo em 30 dias
  FOR v_rec IN
    SELECT sh.id AS hom_id, sh.supplier_id, sh.validade, s.company_id, co.nome_crm
    FROM supplier_homologations sh
    JOIN suppliers s ON s.id = sh.supplier_id
    JOIN companies co ON co.id = s.company_id
    WHERE sh.status = 'homologado'
      AND sh.validade BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
      -- Evitar duplicar alerta
      AND NOT EXISTS (
        SELECT 1 FROM alerts a 
        WHERE a.company_id = s.company_id 
          AND a.type = 'supplier_homologacao_vencendo'
          AND a.created_at >= NOW() - INTERVAL '7 days'
      )
  LOOP
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_rec.company_id,
      'supplier_homologacao_vencendo',
      'high',
      'Homologação Vencendo: ' || v_rec.nome_crm,
      'A homologação do fornecedor ' || v_rec.nome_crm || ' vence em ' || (v_rec.validade - CURRENT_DATE) || ' dias.',
      'active',
      jsonb_build_object('supplier_id', v_rec.supplier_id, 'homologation_id', v_rec.hom_id, 'dias_restantes', v_rec.validade - CURRENT_DATE),
      NOW(), NOW()
    );

    v_vencendo := v_vencendo + 1;
  END LOOP;

  RETURN json_build_object('vencidas_processadas', v_vencidas, 'alertas_vencendo', v_vencendo);
END;
$$ LANGUAGE plpgsql;
