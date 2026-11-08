CREATE OR REPLACE FUNCTION public.suggest_next_contact_channel(p_company_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_prefs jsonb;
  v_last_channel text;
  v_suggested text;
  v_reason text;
BEGIN
  v_prefs := get_communication_preferences(p_company_id);
  
  SELECT channel INTO v_last_channel
  FROM interactions
  WHERE company_id = p_company_id AND channel IS NOT NULL
  ORDER BY data_interacao DESC
  LIMIT 1;
  
  IF v_prefs->>'preferred_channel' IS NOT NULL AND (v_prefs->'response_rates_by_channel'->>v_prefs->>'preferred_channel')::numeric > 30 THEN
    v_suggested := v_prefs->>'preferred_channel';
    v_reason := 'Canal preferido com boa taxa de resposta';
  ELSIF v_last_channel IS NOT NULL AND v_last_channel != 'whatsapp' THEN
    v_suggested := 'whatsapp';
    v_reason := 'Tentar canal diferente do último';
  ELSE
    v_suggested := 'phone';
    v_reason := 'Canal padrão para primeira tentativa';
  END IF;
  
  RETURN jsonb_build_object(
    'suggested_channel', v_suggested,
    'reason', v_reason,
    'last_channel_used', v_last_channel,
    'best_time', v_prefs->>'best_contact_hour',
    'preferences', v_prefs
  );
END;
$function$
