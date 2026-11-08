CREATE OR REPLACE FUNCTION zapp_history.auto_tag_contact_from_nlp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_product TEXT;
  v_new_tags TEXT[];
  v_current_tags TEXT[];
BEGIN
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.nlp_structured_order IS NULL THEN
    RETURN NEW;
  END IF;

  v_product := NEW.nlp_structured_order->>'product';
  IF v_product IS NULL OR v_product = '' THEN
    RETURN NEW;
  END IF;

  -- Tags a adicionar
  v_new_tags := ARRAY[
    'wpp:produto:' || lower(v_product),
    'wpp:lead:' || COALESCE(NEW.nlp_sentiment, 'neutral'),
    'wpp:auto'
  ];

  -- Lê tags atuais do contato
  SELECT tags_array INTO v_current_tags
  FROM public.contacts WHERE id = NEW.contact_id;

  -- Faz union e atualiza
  UPDATE public.contacts
  SET tags_array = (
    SELECT ARRAY(SELECT DISTINCT unnest(COALESCE(v_current_tags, ARRAY[]::TEXT[]) || v_new_tags))
  ),
  updated_at = NOW()
  WHERE id = NEW.contact_id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$function$
