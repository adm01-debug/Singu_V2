CREATE OR REPLACE FUNCTION public.map_channel_to_type(ch text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
    RETURN CASE ch
        WHEN 'whatsapp' THEN 'whatsapp'
        WHEN 'email' THEN 'email'
        WHEN 'telefone' THEN 'call'
        WHEN 'sms' THEN 'whatsapp'
        WHEN 'reuniao_presencial' THEN 'meeting'
        WHEN 'reuniao_online' THEN 'meeting'
        WHEN 'chat_site' THEN 'whatsapp'
        WHEN 'redes_sociais' THEN 'social'
        WHEN 'bitrix_chat' THEN 'whatsapp'
        ELSE 'note'
    END;
END;
$function$
