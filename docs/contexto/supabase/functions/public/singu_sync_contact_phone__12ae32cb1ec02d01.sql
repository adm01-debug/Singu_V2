CREATE OR REPLACE FUNCTION public.singu_sync_contact_phone()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact_id uuid;
  v_primary_phone text;
  v_primary_whatsapp text;
BEGIN
  v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);

  -- Phone primário: qualquer tipo, preferir primary
  SELECT numero INTO v_primary_phone
  FROM public.contact_phones
  WHERE contact_id = v_contact_id AND numero IS NOT NULL
  ORDER BY is_primary DESC, is_verified DESC, created_at DESC
  LIMIT 1;

  -- Whatsapp: só phones com is_whatsapp=true
  SELECT numero INTO v_primary_whatsapp
  FROM public.contact_phones
  WHERE contact_id = v_contact_id AND numero IS NOT NULL AND is_whatsapp = true
  ORDER BY is_primary DESC, created_at DESC
  LIMIT 1;

  UPDATE public.contacts 
  SET 
    phone = v_primary_phone,
    whatsapp = v_primary_whatsapp
  WHERE id = v_contact_id 
    AND (COALESCE(phone,'') IS DISTINCT FROM COALESCE(v_primary_phone,'')
         OR COALESCE(whatsapp,'') IS DISTINCT FROM COALESCE(v_primary_whatsapp,''));

  RETURN COALESCE(NEW, OLD);
END;
$function$
