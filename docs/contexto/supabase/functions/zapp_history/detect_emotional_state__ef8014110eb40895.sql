CREATE OR REPLACE FUNCTION zapp_history.detect_emotional_state(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
  v_happy INT := 0;
  v_anger INT := 0;
  v_anxiety INT := 0;
  v_confidence INT := 0;
  v_sadness INT := 0;
  v_excitement INT := 0;
  v_dominant TEXT;
  v_max INT;
BEGIN
  IF p_text IS NULL THEN RETURN jsonb_build_object('dominant','indefinido'); END IF;
  v_text_lower := lower(p_text);

  -- Felicidade/satisfação
  IF v_text_lower ~ '(feliz|content[ea]|satisfeit[oa]|adoro|amo|gostei|que [oó]timo|legal|massa|top|maravilha)' THEN v_happy := v_happy + 2; END IF;
  IF v_text_lower ~ '(perfeito|excelente|incr[íi]vel|fant[áa]stico|sensacional|nota 10)' THEN v_happy := v_happy + 3; END IF;

  -- Raiva
  IF v_text_lower ~ '(absurdo|inaceit[áa]vel|p[ée]ssimo|horr[íi]vel|raiva|irritad[oa]|furi[oa]s[oa])' THEN v_anger := v_anger + 4; END IF;
  IF v_text_lower ~ '(que merda|merda|porra|caralho|filho da)' THEN v_anger := v_anger + 5; END IF;
  IF v_text_lower ~ '(n[ãa]o aguento|cansad[oa] disso|chega|basta)' THEN v_anger := v_anger + 2; END IF;

  -- Ansiedade
  IF v_text_lower ~ '(urgente|preciso (logo|agora|j[áa])|n[ãa]o posso esperar|estou (preocupad[oa]|ansios[oa]))' THEN v_anxiety := v_anxiety + 3; END IF;
  IF v_text_lower ~ '(e a[íi]\?|cad[êe]\?|ainda n[ãa]o (chegou|tenho|recebi)|prazo apertado)' THEN v_anxiety := v_anxiety + 2; END IF;
  IF v_text_lower ~ '(estresse|estressad[oa]|nervos[oa]|aflit[oa])' THEN v_anxiety := v_anxiety + 3; END IF;

  -- Confiança/decisão firme
  IF v_text_lower ~ '(certeza|com certeza|sem d[úu]vida|definitivamente|j[áa] decidi)' THEN v_confidence := v_confidence + 3; END IF;
  IF v_text_lower ~ '(confio|confian[çc]a|tranquil[oa]|pode deixar|conta comigo)' THEN v_confidence := v_confidence + 2; END IF;

  -- Tristeza/decepção
  IF v_text_lower ~ '(triste|chate[ai]d[oa]|decepcionad[oa]|frustrad[oa]|desanimad[oa])' THEN v_sadness := v_sadness + 3; END IF;
  IF v_text_lower ~ '(esperava (mais|outra coisa)|achei que (seria|fosse)|que pena|infelizmente)' THEN v_sadness := v_sadness + 2; END IF;

  -- Empolgação
  IF v_text_lower ~ '(animad[oa]|empolgad[oa]|mal posso esperar|vou amar|que demais)' THEN v_excitement := v_excitement + 3; END IF;
  IF p_text ~ '!{2,}' THEN v_excitement := v_excitement + 1; END IF;

  v_max := GREATEST(v_happy, v_anger, v_anxiety, v_confidence, v_sadness, v_excitement);

  IF v_max = 0 THEN v_dominant := 'neutro';
  ELSIF v_max = v_anger THEN v_dominant := 'raiva';
  ELSIF v_max = v_anxiety THEN v_dominant := 'ansiedade';
  ELSIF v_max = v_sadness THEN v_dominant := 'tristeza';
  ELSIF v_max = v_excitement THEN v_dominant := 'empolgacao';
  ELSIF v_max = v_happy THEN v_dominant := 'felicidade';
  ELSIF v_max = v_confidence THEN v_dominant := 'confianca';
  END IF;

  RETURN jsonb_build_object(
    'dominant', v_dominant,
    'happiness', v_happy,
    'anger', v_anger,
    'anxiety', v_anxiety,
    'confidence', v_confidence,
    'sadness', v_sadness,
    'excitement', v_excitement
  );
END;
$function$
