CREATE OR REPLACE FUNCTION public.get_buyer_document_path(_token text, _document_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  _room public.deal_rooms;
  _path TEXT;
BEGIN
  SELECT * INTO _room FROM public.deal_rooms WHERE share_token = _token AND share_enabled = true LIMIT 1;
  IF _room.id IS NULL THEN RETURN NULL; END IF;

  SELECT file_path INTO _path FROM public.deal_room_documents
  WHERE id = _document_id AND room_id = _room.id;

  RETURN _path;
END;
$function$
