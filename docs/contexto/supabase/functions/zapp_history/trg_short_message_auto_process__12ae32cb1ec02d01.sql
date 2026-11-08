CREATE OR REPLACE FUNCTION zapp_history.trg_short_message_auto_process()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
DECLARE
  v_trimmed TEXT;
  v_alnum_count INT;
BEGIN
  v_trimmed := trim(COALESCE(NEW.content, ''));
  -- Conta caracteres alfanuméricos (letras/números em qualquer script)
  v_alnum_count := length(regexp_replace(v_trimmed, '[^[:alnum:]]', '', 'g'));

  -- Se não tem conteúdo real (menos de 3 caracteres alfanuméricos), auto-processa
  IF v_alnum_count < 3 THEN
    NEW.nlp_processed_at := NOW();
    NEW.nlp_sentiment := 'neutral';
    NEW.lead_score := COALESCE(NEW.lead_score, 0);
    NEW.primary_intent := CASE
      WHEN lower(v_trimmed) ~ '^(oi|ola|hi|hey|eae|opa|bom dia|boa tarde|boa noite)$' THEN 'saudacao'
      WHEN lower(v_trimmed) ~ '^(ok|okey|blz|beleza|certo|sim|nao|não|vlw|valeu)$' THEN 'confirmacao'
      ELSE 'mensagem_curta'
    END;
  END IF;
  RETURN NEW;
END;
$function$
