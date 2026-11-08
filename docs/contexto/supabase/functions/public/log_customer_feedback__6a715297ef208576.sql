CREATE OR REPLACE FUNCTION public.log_customer_feedback(p_company_id uuid, p_contact_id uuid DEFAULT NULL::uuid, p_rating integer DEFAULT NULL::integer, p_category text DEFAULT NULL::text, p_feedback text DEFAULT NULL::text, p_channel text DEFAULT 'manual'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_interaction_id uuid;
  v_notes text;
BEGIN
  IF p_rating IS NOT NULL AND (p_rating < 1 OR p_rating > 5) THEN
    RAISE EXCEPTION 'Rating deve ser entre 1 e 5';
  END IF;
  
  v_notes := COALESCE(p_category || ': ', '') || COALESCE(p_feedback, '') || 
    CASE WHEN p_rating IS NOT NULL THEN ' (Nota: ' || p_rating || '/5)' ELSE '' END;
  
  INSERT INTO interactions (
    company_id, contact_id, type, channel, resumo, content,
    sentiment, user_id, data_interacao
  )
  VALUES (
    p_company_id, p_contact_id, 'feedback', p_channel,
    v_notes, v_notes,
    CASE 
      WHEN p_rating >= 4 THEN 'positive'
      WHEN p_rating = 3 THEN 'neutral'
      WHEN p_rating <= 2 THEN 'negative'
      ELSE 'neutral'
    END,
    auth.uid(), NOW()
  )
  RETURNING id INTO v_interaction_id;
  
  RETURN v_interaction_id;
END;
$function$
