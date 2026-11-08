CREATE OR REPLACE FUNCTION public.singu_sales_team_members_compat()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- SINGU só envia user_id, CRM exige member_user_id
  IF NEW.member_user_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.member_user_id := NEW.user_id;
  END IF;
  -- Caso contrário (SINGU enviando profile_user_id), fallback
  IF NEW.member_user_id IS NULL AND NEW.profile_user_id IS NOT NULL THEN
    NEW.member_user_id := NEW.profile_user_id;
    IF NEW.user_id IS NULL THEN NEW.user_id := NEW.profile_user_id; END IF;
  END IF;
  RETURN NEW;
END;
$function$
