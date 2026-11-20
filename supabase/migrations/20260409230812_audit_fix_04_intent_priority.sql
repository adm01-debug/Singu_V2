-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409230812
-- nome:   audit_fix_04_intent_priority

CREATE OR REPLACE FUNCTION zapp_history.detect_primary_intent(p_text TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_has_want_qty BOOLEAN;
  v_has_buy_signal BOOLEAN;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- Primeiro detecta sinais fortes de compra/cotação
  v_has_want_qty := v_text_lower ~ '(quero|preciso de|queria|gostaria de|necessito)\s+(\d+|uma|um|alguns|v[áa]rios)';
  v_has_buy_signal := v_text_lower ~ '\m(or[çc]amento|or[çc]ar|cota[çc][ãa]o|quanto (custa|fica|sai)|qual (o )?pre[çc]o|valor)\M';

  -- Reclamar/Cancelar (prioridade máxima, bloqueia)
  IF v_text_lower ~ '(reclamar|reclama[çc][ãa]o|insatisfeit[oa]|p[ée]ssimo|absurdo|inaceit[áa]vel)' THEN RETURN 'reclamar'; END IF;
  IF v_text_lower ~ '(cancelar|cancelamento|desisti|n[ãa]o quero mais|estornar|reembolso)' THEN RETURN 'cancelar'; END IF;

  -- Comprar (intenção firme, vence elogiar)
  IF v_text_lower ~ '(quero comprar|fechar pedido|fechar com voc[êe]s|fa[cz]er o pedido|pode produzir|fechado|aprovado|manda o boleto|enviar pix|pode faturar)' THEN RETURN 'comprar'; END IF;

  -- Cotar (sempre que tem "quero X quantidade" ou palavra de cotação)
  IF v_has_want_qty OR v_has_buy_signal THEN RETURN 'cotar'; END IF;

  -- Negociar
  IF v_text_lower ~ '(desconto|melhor pre[çc]o|condi[çc][ãa]o|abate|negocia|cobrir esse valor|mais barato em)' THEN RETURN 'negociar'; END IF;

  -- Acompanhar pedido
  IF v_text_lower ~ '(rastreio|status do pedido|c[óo]digo de rastreamento|onde est[áa] meu pedido|como anda)' THEN RETURN 'acompanhar'; END IF;

  -- Suporte
  IF v_text_lower ~ '(n[ãa]o (consigo|funciona|abre)|d[úu]vida t[ée]cnica|me ajuda com|como fa[çc]o)' THEN RETURN 'suporte'; END IF;

  -- Elogiar (só se NÃO tiver sinal de compra/cotação junto)
  IF v_text_lower ~ '(parab[ée]ns|excelente|maravilho|adorei|amei|recomendo|nota 10|top demais)' THEN
    -- Se é elogio PURO (sem querer nada depois) → elogiar
    -- Se é elogio + quero/cotação → já foi tratado acima
    RETURN 'elogiar';
  END IF;

  -- Perguntar
  IF v_text_lower ~ '(\?|trabalham com|fazem|tem|voc[êe]s|gostaria de saber|me explica)' THEN RETURN 'perguntar'; END IF;

  -- Saudação
  IF v_text_lower ~ '^(oi|ol[áa]|bom dia|boa tarde|boa noite|opa|fala|salve)\.?\s*$' THEN RETURN 'saudacao'; END IF;

  RETURN 'outro';
END;
$fn$;
