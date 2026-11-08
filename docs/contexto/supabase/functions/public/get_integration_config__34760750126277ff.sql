CREATE OR REPLACE FUNCTION public.get_integration_config(p_integration text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE v_config jsonb;
BEGIN
  -- Configurações padrão por integração
  v_config := CASE p_integration
    WHEN 'bitrix24' THEN '{"api_url": "https://promo.bitrix24.com.br", "webhook_enabled": true}'::jsonb
    WHEN 'whatsapp' THEN '{"provider": "evolution", "auto_reply": true}'::jsonb
    WHEN 'n8n' THEN '{"webhook_url": "https://n8n.atomicabr.com.br", "enabled": true}'::jsonb
    ELSE '{}'::jsonb
  END;
  RETURN v_config;
END;
$function$
