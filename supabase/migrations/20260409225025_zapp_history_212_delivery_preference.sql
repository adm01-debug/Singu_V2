-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409225025
-- nome:   zapp_history_212_delivery_preference

CREATE OR REPLACE FUNCTION zapp_history.detect_delivery_preference(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_method TEXT := NULL;
  v_urgency TEXT := NULL;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('method',null); END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '(retirar|retirada|ir buscar|passo a[íi]|vou a[íi] buscar)' THEN v_method := 'retirada_local';
  ELSIF v_text_lower ~ '(motoboy|moto ?boy|entrega r[áa]pida)' THEN v_method := 'motoboy';
  ELSIF v_text_lower ~ '(sedex|correios|pac)' THEN v_method := 'correios';
  ELSIF v_text_lower ~ '(transportadora|rodonaves|jadlog|azul cargo)' THEN v_method := 'transportadora';
  ELSIF v_text_lower ~ '(entrega pr[óo]pria|frota|caminh[ãa]o da empresa)' THEN v_method := 'frota_propria';
  END IF;

  IF v_text_lower ~ '(hoje|agora|j[áa]|imediato|urgent[ea]|expresso)' THEN v_urgency := 'imediato';
  ELSIF v_text_lower ~ '(amanh[ãa])' THEN v_urgency := 'proximo_dia';
  ELSIF v_text_lower ~ '(esta semana|at[ée] sexta)' THEN v_urgency := 'semana';
  ELSIF v_text_lower ~ '(pr[óo]xim[oa] semana)' THEN v_urgency := 'proxima_semana';
  ELSIF v_text_lower ~ '(pr[óo]xim[oa] m[êe]s|sem pressa)' THEN v_urgency := 'sem_pressa';
  END IF;

  IF v_method IS NULL AND v_urgency IS NULL THEN RETURN jsonb_build_object('method', null); END IF;
  RETURN jsonb_build_object('method', v_method, 'urgency', v_urgency);
END;
$fn$;

ALTER TABLE zapp_history.messages ADD COLUMN IF NOT EXISTS delivery_preference JSONB;
CREATE INDEX IF NOT EXISTS idx_messages_delivery ON zapp_history.messages((delivery_preference->>'method'))
  WHERE delivery_preference IS NOT NULL;
GRANT EXECUTE ON FUNCTION zapp_history.detect_delivery_preference(TEXT) TO authenticated, service_role;
