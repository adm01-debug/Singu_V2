-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409205228
-- nome:   zapp_history_142_payment_preference

CREATE OR REPLACE FUNCTION zapp_history.detect_payment_preference(p_text TEXT)
RETURNS TEXT[] LANGUAGE plpgsql IMMUTABLE AS $fn$
DECLARE
  v_text_lower TEXT;
  v_prefs TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN v_prefs; END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '\m(pix|chave pix|qr code)\M' THEN v_prefs := array_append(v_prefs, 'pix'); END IF;
  IF v_text_lower ~ '\m(boleto|boletos|c[óo]digo de barras)\M' THEN v_prefs := array_append(v_prefs, 'boleto'); END IF;
  IF v_text_lower ~ '(cart[ãa]o de cr[ée]dito|cart[ãa]o cr[ée]dito|cr[ée]dito)' THEN v_prefs := array_append(v_prefs, 'cartao_credito'); END IF;
  IF v_text_lower ~ '(cart[ãa]o de d[ée]bito|cart[ãa]o d[ée]bito|d[ée]bito)' THEN v_prefs := array_append(v_prefs, 'cartao_debito'); END IF;
  IF v_text_lower ~ '(parcel(a|ar|ado|amento)|em \d+ vezes|\d+x|\d+ x)' THEN v_prefs := array_append(v_prefs, 'parcelado'); END IF;
  IF v_text_lower ~ '(transfer[êe]ncia|ted|doc)' THEN v_prefs := array_append(v_prefs, 'transferencia'); END IF;
  IF v_text_lower ~ '(faturar|faturamento|nota fiscal|nf-?e|empenho|nota faturada)' THEN v_prefs := array_append(v_prefs, 'faturado'); END IF;
  IF v_text_lower ~ '(\m30 dias\M|\m45 dias\M|\m60 dias\M|\m90 dias\M|\b30 ddl\b|\b45 ddl\b|\b60 ddl\b|prazo \d+)' THEN v_prefs := array_append(v_prefs, 'prazo_estendido'); END IF;
  IF v_text_lower ~ '([áa] vista|à vista|avista)' THEN v_prefs := array_append(v_prefs, 'a_vista'); END IF;
  IF v_text_lower ~ '(50% (entrada|adiantado)|sinal|entrada de)' THEN v_prefs := array_append(v_prefs, 'sinal_entrada'); END IF;

  RETURN v_prefs;
END;
$fn$;

ALTER TABLE zapp_history.messages
  ADD COLUMN IF NOT EXISTS payment_preferences TEXT[];

CREATE INDEX IF NOT EXISTS idx_messages_payment_prefs ON zapp_history.messages USING GIN (payment_preferences)
  WHERE payment_preferences IS NOT NULL AND array_length(payment_preferences, 1) > 0;

GRANT EXECUTE ON FUNCTION zapp_history.detect_payment_preference(TEXT) TO authenticated, service_role;
