CREATE OR REPLACE FUNCTION public.auto_classify_sentiment(p_text text)
 RETURNS jsonb
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sentiment text := 'neutral';
  v_score numeric := 0.5;
  v_positive_words text[] := ARRAY['obrigado', 'excelente', 'ótimo', 'maravilhoso', 'perfeito', 'adorei', 'fantástico', 'incrível', 'satisfeito', 'recomendo'];
  v_negative_words text[] := ARRAY['ruim', 'péssimo', 'horrível', 'decepcionado', 'problema', 'reclamação', 'atraso', 'cancelar', 'insatisfeito', 'nunca mais'];
  v_text_lower text;
  v_pos_count int := 0;
  v_neg_count int := 0;
BEGIN
  v_text_lower := LOWER(p_text);
  SELECT COUNT(*) INTO v_pos_count FROM UNNEST(v_positive_words) w WHERE v_text_lower LIKE '%' || w || '%';
  SELECT COUNT(*) INTO v_neg_count FROM UNNEST(v_negative_words) w WHERE v_text_lower LIKE '%' || w || '%';
  IF v_pos_count > v_neg_count THEN v_sentiment := 'positive'; v_score := 0.5 + (v_pos_count * 0.1);
  ELSIF v_neg_count > v_pos_count THEN v_sentiment := 'negative'; v_score := 0.5 - (v_neg_count * 0.1); END IF;
  v_score := GREATEST(0, LEAST(1, v_score));
  RETURN jsonb_build_object('sentiment', v_sentiment, 'score', ROUND(v_score, 2));
END;
$function$
