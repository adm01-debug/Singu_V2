CREATE OR REPLACE FUNCTION public.seed_deal_room(_user_id uuid, _deal_id text, _deal_name text, _company_id uuid, _title text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _id UUID;
BEGIN
  IF _user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT id INTO _id FROM public.deal_rooms
  WHERE user_id = _user_id AND deal_id = _deal_id LIMIT 1;

  IF _id IS NOT NULL THEN
    RETURN _id;
  END IF;

  INSERT INTO public.deal_rooms (user_id, deal_id, deal_name, company_id, title)
  VALUES (_user_id, _deal_id, _deal_name, _company_id, COALESCE(_title, _deal_name, 'Deal Room'))
  RETURNING id INTO _id;

  RETURN _id;
END;
$function$
