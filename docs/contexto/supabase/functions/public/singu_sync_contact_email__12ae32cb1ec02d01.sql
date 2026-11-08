CREATE OR REPLACE FUNCTION public.singu_sync_contact_email()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_contact_id uuid;
  v_primary_email text;
BEGIN
  -- Pegar contact_id do NEW ou OLD (dependendo da operação)
  v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);

  -- Recomputar o email primário do contact (pode ter mudado)
  SELECT email INTO v_primary_email
  FROM public.contact_emails
  WHERE contact_id = v_contact_id AND email IS NOT NULL
  ORDER BY is_primary DESC, is_verified DESC, created_at DESC
  LIMIT 1;

  -- Atualizar contacts.email (mesmo se ficou NULL, ex: deletou último email)
  UPDATE public.contacts 
  SET email = v_primary_email
  WHERE id = v_contact_id AND COALESCE(email,'') IS DISTINCT FROM COALESCE(v_primary_email,'');

  RETURN COALESCE(NEW, OLD);
END;
$function$
