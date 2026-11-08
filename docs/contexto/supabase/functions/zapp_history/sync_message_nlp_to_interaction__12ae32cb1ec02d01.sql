CREATE OR REPLACE FUNCTION zapp_history.sync_message_nlp_to_interaction()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_interaction_id UUID;
  v_tags TEXT[];
  v_entity JSONB;
BEGIN
  -- Só dispara quando NLP acabou de ser populado
  IF NEW.nlp_processed_at IS NULL OR OLD.nlp_processed_at IS NOT NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.nlp_entities IS NULL THEN
    RETURN NEW;
  END IF;

  -- Constrói tags_array a partir das entidades
  v_tags := ARRAY['whatsapp', 'auto_nlp'];
  FOR v_entity IN SELECT * FROM jsonb_array_elements(COALESCE(NEW.nlp_entities, '[]'::jsonb))
  LOOP
    v_tags := array_append(v_tags, (v_entity->>'type') || ':' || (v_entity->>'value'));
  END LOOP;

  INSERT INTO public.interactions (
    contact_id, company_id, channel, direction, status,
    assunto, resumo, conteudo, data_interacao,
    source_system, sentiment, metadata, tags_array, key_insights,
    follow_up_required, type, title, content
  ) VALUES (
    NEW.contact_id, NEW.company_id, 'whatsapp', NEW.direction, 'concluido',
    LEFT('WhatsApp ' || COALESCE(NEW.nlp_sentiment, '') || ' - ' || COALESCE(NEW.content, ''), 200),
    LEFT(COALESCE(NEW.content, ''), 500),
    NEW.content,
    NEW.created_at,
    'zapp_history_realtime',
    NEW.nlp_sentiment,
    jsonb_build_object(
      'subtype', 'whatsapp_message_nlp',
      'message_id', NEW.id,
      'message_type', NEW.message_type,
      'nlp_sentiment', NEW.nlp_sentiment,
      'nlp_sentiment_score', NEW.nlp_sentiment_score,
      'nlp_entities', NEW.nlp_entities,
      'structured_order', NEW.nlp_structured_order,
      'whatsapp_message_id', NEW.whatsapp_message_id
    ),
    v_tags,
    CASE
      WHEN NEW.nlp_structured_order IS NOT NULL AND NEW.nlp_structured_order <> '{}'::jsonb
        THEN ARRAY['📦 Pedido detectado: ' || (NEW.nlp_structured_order::text)]
      ELSE ARRAY[]::TEXT[]
    END,
    NEW.nlp_sentiment IN ('urgent', 'angry', 'negative'),
    'whatsapp',
    LEFT('WhatsApp - ' || COALESCE(NEW.nlp_sentiment, 'msg'), 100),
    NEW.content
  )
  RETURNING id INTO v_interaction_id;

  -- Guarda referência da interaction criada
  UPDATE zapp_history.messages
  SET raw_payload = COALESCE(raw_payload, '{}'::jsonb) ||
                    jsonb_build_object('singu_interaction_id', v_interaction_id)
  WHERE id = NEW.id;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Não bloqueia o trigger original
  RAISE WARNING 'sync_message_nlp_to_interaction: %', SQLERRM;
  RETURN NEW;
END;
$function$
