CREATE OR REPLACE FUNCTION public.singu_interactions_compat_sync()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Job único: NORMALIZAR type para vocabulário do CHECK constraint
  -- Valores válidos: whatsapp, call, email, meeting, note, social, system, commercial, sdr_alert
  -- O sync_interaction_fields do CRM fará type↔channel depois
  IF NEW.type IS NOT NULL THEN
    NEW.type := CASE 
      WHEN NEW.type = ANY(ARRAY['whatsapp','call','email','meeting','note','social','system','commercial','sdr_alert']) THEN NEW.type
      WHEN NEW.type ILIKE '%whats%' OR NEW.type = 'wa' THEN 'whatsapp'
      WHEN NEW.type ILIKE '%email%' OR NEW.type ILIKE '%e-mail%' OR NEW.type = 'mail' THEN 'email'
      WHEN NEW.type ILIKE '%call%' OR NEW.type ILIKE '%liga%' OR NEW.type ILIKE '%phone%' OR NEW.type ILIKE '%telefone%' THEN 'call'
      WHEN NEW.type ILIKE '%meet%' OR NEW.type ILIKE '%reun%' THEN 'meeting'
      WHEN NEW.type ILIKE '%note%' OR NEW.type ILIKE '%nota%' OR NEW.type ILIKE '%obs%' THEN 'note'
      WHEN NEW.type ILIKE '%social%' OR NEW.type ILIKE '%insta%' OR NEW.type ILIKE '%linkedin%' OR NEW.type ILIKE '%facebook%' THEN 'social'
      WHEN NEW.type ILIKE '%sdr%' OR NEW.type ILIKE '%alert%' THEN 'sdr_alert'
      WHEN NEW.type ILIKE '%commerc%' OR NEW.type ILIKE '%comerc%' THEN 'commercial'
      WHEN NEW.type ILIKE '%system%' OR NEW.type ILIKE '%sistema%' THEN 'system'
      ELSE 'note'
    END;
  END IF;

  -- direction default: se NULL, setar outbound  
  -- (sync_interaction_fields vai popular initiated_by depois)
  IF NEW.direction IS NULL THEN
    NEW.direction := 'outbound';
  END IF;

  RETURN NEW;
END;
$function$
