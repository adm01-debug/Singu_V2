-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260330121918
-- nome:   create_fn_check_carrier_homologation_expiry

CREATE OR REPLACE FUNCTION fn_check_carrier_homologation_expiry()
RETURNS json
LANGUAGE plpgsql
AS $function$
DECLARE
  v_vencidas INTEGER := 0;
  v_vencendo INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- Homologações VENCIDAS: mudar status + alerta critical
  FOR v_rec IN
    SELECT ch.id AS hom_id, ch.carrier_id, c.company_id, co.nome_crm
    FROM carrier_homologations ch
    JOIN carriers c ON c.id = ch.carrier_id
    JOIN companies co ON co.id = c.company_id
    WHERE ch.status = 'homologado' AND ch.validade < CURRENT_DATE
  LOOP
    UPDATE carrier_homologations SET status = 'vencido' WHERE id = v_rec.hom_id;
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_rec.company_id,
      'carrier_homologacao_vencida', 'critical',
      'Homologação Vencida: ' || v_rec.nome_crm,
      'A homologação da transportadora ' || v_rec.nome_crm || ' venceu. Necessário reavaliar antes de novos envios.',
      'pending',
      jsonb_build_object('carrier_id', v_rec.carrier_id, 'homologation_id', v_rec.hom_id),
      NOW(), NOW());
    v_vencidas := v_vencidas + 1;
  END LOOP;

  -- Homologações VENCENDO (30 dias): alerta high (cooldown 7 dias)
  FOR v_rec IN
    SELECT ch.id AS hom_id, ch.carrier_id, ch.validade, c.company_id, co.nome_crm
    FROM carrier_homologations ch
    JOIN carriers c ON c.id = ch.carrier_id
    JOIN companies co ON co.id = c.company_id
    WHERE ch.status = 'homologado'
      AND ch.validade BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
      AND NOT EXISTS (
        SELECT 1 FROM alerts a WHERE a.company_id = c.company_id 
        AND a.type = 'carrier_homologacao_vencendo' AND a.created_at >= NOW() - INTERVAL '7 days')
  LOOP
    INSERT INTO alerts (id, company_id, type, priority, title, message, status, metadata, created_at, updated_at)
    VALUES (gen_random_uuid(), v_rec.company_id,
      'carrier_homologacao_vencendo', 'high',
      'Homologação Vencendo: ' || v_rec.nome_crm,
      'A homologação da transportadora ' || v_rec.nome_crm || ' vence em ' || (v_rec.validade - CURRENT_DATE) || ' dias.',
      'pending',
      jsonb_build_object('carrier_id', v_rec.carrier_id, 'homologation_id', v_rec.hom_id, 'dias_restantes', v_rec.validade - CURRENT_DATE),
      NOW(), NOW());
    v_vencendo := v_vencendo + 1;
  END LOOP;

  RETURN json_build_object('vencidas_processadas', v_vencidas, 'alertas_vencendo', v_vencendo);
END;
$function$;

COMMENT ON FUNCTION fn_check_carrier_homologation_expiry() IS 'Detecta homologações de transportadoras vencidas (muda status + alerta critical) e vencendo (alerta high, cooldown 7d).';
