-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409190505
-- nome:   zapp_history_132_churn_risk

CREATE OR REPLACE FUNCTION zapp_history.detect_churn_risk(p_text TEXT)
RETURNS JSONB LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_score INT := 0;
  v_signals TEXT[] := ARRAY[]::TEXT[];
  v_risk TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('risk', 'none', 'score', 0, 'signals', '[]'::jsonb); END IF;
  v_text_lower := lower(p_text);

  -- Sinais de raiva/frustração
  IF v_text_lower ~ '(absurdo|inaceit[áa]vel|p[ée]ssimo|horr[íi]vel|ridículo|cad[êe] (a|o)|que cad[êe])' THEN
    v_score := v_score + 30;
    v_signals := array_append(v_signals, 'frustracao_explicita');
  END IF;

  -- Ameaça de cancelamento
  IF v_text_lower ~ '(cancelar|cancela|desisti|n[ãa]o quero mais|deixa pra l[áa]|esquece|nunca mais|nem quero)' THEN
    v_score := v_score + 40;
    v_signals := array_append(v_signals, 'ameaca_cancelamento');
  END IF;

  -- Ameaça de migrar
  IF v_text_lower ~ '(vou pro concorrente|outro fornecedor melhor|vou comprar em outro|outra empresa atende)' THEN
    v_score := v_score + 35;
    v_signals := array_append(v_signals, 'ameaca_migracao');
  END IF;

  -- Reclamação de demora
  IF v_text_lower ~ '(demora demais|esperando h[áa] (muito|dias|horas)|sem resposta|ningu[ée]m responde|desde (ontem|semana))' THEN
    v_score := v_score + 25;
    v_signals := array_append(v_signals, 'demora_atendimento');
  END IF;

  -- Reclamação de qualidade
  IF v_text_lower ~ '(veio errado|com defeito|quebrado|amassado|pedido errado|n[ãa]o foi isso que pedi)' THEN
    v_score := v_score + 30;
    v_signals := array_append(v_signals, 'reclamacao_qualidade');
  END IF;

  -- Pedido de reembolso
  IF v_text_lower ~ '(quero (meu )?dinheiro de volta|estorno|reembolso|devolu[çc][ãa]o|pix de volta)' THEN
    v_score := v_score + 35;
    v_signals := array_append(v_signals, 'pedido_reembolso');
  END IF;

  -- Procon/jurídico
  IF v_text_lower ~ '(procon|reclame aqui|advogado|jur[íi]dico|processar|justi[çc]a|denúncia)' THEN
    v_score := v_score + 50;
    v_signals := array_append(v_signals, 'ameaca_juridica');
  END IF;

  v_risk := CASE
    WHEN v_score >= 70 THEN 'critico'
    WHEN v_score >= 40 THEN 'alto'
    WHEN v_score >= 20 THEN 'medio'
    WHEN v_score > 0 THEN 'baixo'
    ELSE 'none'
  END;

  RETURN jsonb_build_object(
    'risk', v_risk,
    'score', v_score,
    'signals', to_jsonb(v_signals)
  );
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS churn_risk JSONB;

CREATE INDEX IF NOT EXISTS idx_messages_churn_risk ON zapp_history.messages((churn_risk->>'risk'))
  WHERE churn_risk IS NOT NULL AND (churn_risk->>'risk') <> 'none';

GRANT EXECUTE ON FUNCTION zapp_history.detect_churn_risk(TEXT) TO authenticated, service_role;
