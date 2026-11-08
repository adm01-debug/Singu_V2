CREATE OR REPLACE FUNCTION public.calculate_contact_importance(p_contact_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_score int := 0; v_cargo text;
BEGIN
  SELECT cargo INTO v_cargo FROM contacts WHERE id = p_contact_id;
  
  -- Cargo (+50 max)
  IF v_cargo ILIKE '%CEO%' OR v_cargo ILIKE '%diretor%' OR v_cargo ILIKE '%presidente%' OR v_cargo ILIKE '%owner%' OR v_cargo ILIKE '%dono%' THEN v_score := 50;
  ELSIF v_cargo ILIKE '%gerente%' OR v_cargo ILIKE '%manager%' OR v_cargo ILIKE '%coordenador%' THEN v_score := 35;
  ELSIF v_cargo ILIKE '%supervisor%' OR v_cargo ILIKE '%líder%' OR v_cargo ILIKE '%compra%' THEN v_score := 25;
  ELSIF v_cargo IS NOT NULL THEN v_score := 10;
  END IF;
  
  -- Interações recentes (+20)
  IF EXISTS (SELECT 1 FROM interactions WHERE contact_id = p_contact_id AND data_interacao >= NOW() - interval '30 days') THEN v_score := v_score + 20; END IF;
  
  -- Email corporativo (+15)
  IF EXISTS (SELECT 1 FROM contact_emails WHERE contact_id = p_contact_id AND email NOT LIKE '%gmail%' AND email NOT LIKE '%hotmail%' AND email NOT LIKE '%yahoo%') THEN v_score := v_score + 15; END IF;
  
  -- WhatsApp cadastrado (+15)
  IF EXISTS (SELECT 1 FROM contact_phones WHERE contact_id = p_contact_id AND is_whatsapp = true) THEN v_score := v_score + 15; END IF;
  
  RETURN v_score;
END;
$function$
