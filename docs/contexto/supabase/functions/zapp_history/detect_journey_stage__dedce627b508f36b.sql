CREATE OR REPLACE FUNCTION zapp_history.detect_journey_stage(p_text text, p_funnel_stage text, p_lead_score integer)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'zapp_history', 'pg_catalog'
AS $function$
DECLARE
  v_text_lower TEXT;
BEGIN
  IF p_text IS NULL THEN RETURN NULL; END IF;
  v_text_lower := lower(p_text);

  -- BOFU (Bottom of Funnel) - pronto pra comprar
  IF p_funnel_stage IN ('proposta','negociacao','fechamento') THEN RETURN 'BOFU'; END IF;
  IF v_text_lower ~ '(quero comprar|fechar pedido|fechar com voc[êe]s|fa[cz]er o pedido|enviar boleto|forma de pagamento|prazo de entrega final)' THEN RETURN 'BOFU'; END IF;
  IF p_lead_score >= 70 THEN RETURN 'BOFU'; END IF;

  -- MOFU (Middle of Funnel) - comparando, considerando
  IF p_funnel_stage IN ('cotacao','interesse') THEN RETURN 'MOFU'; END IF;
  IF v_text_lower ~ '(comparativo|diferen[cç]a entre|qual melhor|por que escolher|estou pesquisando|vendo op[cç][õo]es)' THEN RETURN 'MOFU'; END IF;

  -- TOFU (Top of Funnel) - descobrindo, primeira interação
  RETURN 'TOFU';
END;
$function$
