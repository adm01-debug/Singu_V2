CREATE OR REPLACE FUNCTION public.auto_calculate_lead_score()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_score int := 0;
BEGIN
  -- CNPJ válido (+20)
  IF NEW.cnpj IS NOT NULL AND LENGTH(NEW.cnpj) >= 11 THEN v_score := v_score + 20; END IF;
  -- É cliente (+30)
  IF NEW.is_customer = true THEN v_score := v_score + 30; END IF;
  -- Tem responsável (+10)
  IF NEW.user_id IS NOT NULL THEN v_score := v_score + 10; END IF;
  -- Interações recentes (+20)
  IF EXISTS (SELECT 1 FROM interactions WHERE company_id = NEW.id AND data_interacao >= NOW() - interval '30 days') THEN v_score := v_score + 20; END IF;
  -- Deals abertos (+20)
  IF EXISTS (SELECT 1 FROM deals WHERE company_id = NEW.id AND status NOT IN ('ganho', 'perdido')) THEN v_score := v_score + 20; END IF;
  
  NEW.lead_score := v_score;
  NEW.lead_score_updated_at := NOW();
  RETURN NEW;
END;
$function$
