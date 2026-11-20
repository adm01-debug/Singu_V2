-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409210439
-- nome:   zapp_history_152_intent_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_primary_intent(p_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Reclamar (prioridade alta)
  IF v_text_lower ~ '(reclamar|reclama[çc][ãa]o|insatisfeit[oa]|p[ée]ssimo|absurdo|inaceit[áa]vel)' THEN RETURN 'reclamar'; END IF;

  -- Cancelar (prioridade alta)
  IF v_text_lower ~ '(cancelar|cancelamento|desisti|n[ãa]o quero mais|estornar|reembolso)' THEN RETURN 'cancelar'; END IF;

  -- Elogiar
  IF v_text_lower ~ '(parab[ée]ns|excelente|maravilho|adorei|amei|recomendo|nota 10|top demais)' THEN RETURN 'elogiar'; END IF;

  -- Comprar (intenção firme)
  IF v_text_lower ~ '(quero comprar|fechar pedido|fechar com voc[êe]s|fa[cz]er o pedido|pode produzir|fechado|aprovado|manda o boleto|enviar pix)' THEN RETURN 'comprar'; END IF;

  -- Negociar
  IF v_text_lower ~ '(desconto|melhor pre[çc]o|condi[çc][ãa]o|abate|negocia)' THEN RETURN 'negociar'; END IF;

  -- Cotar
  IF v_text_lower ~ '(cota[çc][ãa]o|or[çc]amento|quanto custa|qual o pre[çc]o|me passa o valor)' THEN RETURN 'cotar'; END IF;

  -- Acompanhar pedido
  IF v_text_lower ~ '(rastreio|status do pedido|c[óo]digo de rastreamento|onde est[áa] meu pedido|como anda)' THEN RETURN 'acompanhar'; END IF;

  -- Suporte técnico
  IF v_text_lower ~ '(n[ãa]o (consigo|funciona|abre)|d[úu]vida t[ée]cnica|me ajuda com|como fa[çc]o)' THEN RETURN 'suporte'; END IF;

  -- Perguntar (default mais leve)
  IF v_text_lower ~ '(\?|trabalham com|fazem|tem|voc[êe]s|gostaria de saber|me explica)' THEN RETURN 'perguntar'; END IF;

  -- Saudação
  IF v_text_lower ~ '^(oi|ol[áa]|bom dia|boa tarde|boa noite|opa|fala|salve)\.?\s*$' THEN RETURN 'saudacao'; END IF;

  RETURN 'outro';
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS primary_intent TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_intent ON zapp_history.messages(primary_intent) WHERE primary_intent IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_primary_intent(TEXT) TO authenticated, service_role;
