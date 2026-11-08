CREATE OR REPLACE FUNCTION zapp_history.detect_payment_preference(p_text text)
 RETURNS text[]
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_prefs TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF p_text IS NULL THEN RETURN v_prefs; END IF;
  v_text_lower := lower(p_text);

  IF v_text_lower ~ '\m(pix|qr ?code)\M' THEN v_prefs := array_append(v_prefs,'pix'); END IF;
  IF v_text_lower ~ '\m(boleto|bancario)\M' THEN v_prefs := array_append(v_prefs,'boleto'); END IF;
  IF v_text_lower ~ '\m(cart[ãa]o (de )?cr[ée]dito|visa|master)\M' THEN v_prefs := array_append(v_prefs,'credito'); END IF;
  IF v_text_lower ~ '\m(parcel|12x|10x|6x|3x)\M' THEN v_prefs := array_append(v_prefs,'parcelamento'); END IF;
  IF v_text_lower ~ '\m(30/60|30 dias|faturado|a prazo|fatura|nota com prazo)\M' THEN v_prefs := array_append(v_prefs,'a_prazo'); END IF;
  IF v_text_lower ~ '\m(entrada|sinal|50 ?% na entrega|50/50)\M' THEN v_prefs := array_append(v_prefs,'entrada_sinal'); END IF;
  IF v_text_lower ~ '\m([àa] vista|vista)\M' THEN v_prefs := array_append(v_prefs,'a_vista'); END IF;

  RETURN v_prefs;
END;
$function$
