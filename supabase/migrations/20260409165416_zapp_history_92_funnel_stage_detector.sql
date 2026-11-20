-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409165416
-- nome:   zapp_history_92_funnel_stage_detector

CREATE OR REPLACE FUNCTION zapp_history.detect_funnel_stage(p_text TEXT, p_has_product BOOLEAN, p_has_quantity BOOLEAN, p_has_budget BOOLEAN, p_has_cnpj BOOLEAN)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN 'descoberta'; END IF;
  v_text_lower := lower(p_text);

  -- FECHAMENTO: já está pronto pra fechar
  IF v_text_lower ~ '(fech(ar|ado|amos)|aprovado|pode mandar|pode produzir|confirmado|vou pagar|pix de|envia o boleto|conta pra dep[óo]sito)' THEN
    RETURN 'fechamento';
  END IF;

  -- NEGOCIACAO: discutindo preço/prazo/condições
  IF v_text_lower ~ '(desconto|abate|melhor pre[çc]o|condi[çc][ãa]o|negocia|consigo pagar|que tal|fa[çc]o por|aceita)' THEN
    RETURN 'negociacao';
  END IF;

  -- PROPOSTA: já tem todos os dados pra cotação completa
  IF p_has_product AND p_has_quantity AND (p_has_budget OR p_has_cnpj) THEN
    RETURN 'proposta';
  END IF;

  -- COTACAO: tem produto + quantidade
  IF p_has_product AND p_has_quantity THEN
    RETURN 'cotacao';
  END IF;

  -- INTERESSE: pediu informação de produto
  IF p_has_product OR v_text_lower ~ '(quero saber|gostaria de cotar|preciso de or[çc]amento|trabalham com|fazem)' THEN
    RETURN 'interesse';
  END IF;

  -- DESCOBERTA: primeiro contato sem detalhes
  RETURN 'descoberta';
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS funnel_stage TEXT;

CREATE INDEX IF NOT EXISTS idx_messages_funnel_stage ON zapp_history.messages(funnel_stage) WHERE funnel_stage IS NOT NULL;

GRANT EXECUTE ON FUNCTION zapp_history.detect_funnel_stage(TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN) TO authenticated, service_role;
