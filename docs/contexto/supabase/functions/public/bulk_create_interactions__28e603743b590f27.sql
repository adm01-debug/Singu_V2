CREATE OR REPLACE FUNCTION public.bulk_create_interactions(p_interactions jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item jsonb;
  v_created int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_interaction_date timestamptz;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_interactions)
  LOOP
    BEGIN
      -- Aceitar ambos: interaction_date ou data_interacao
      v_interaction_date := COALESCE(
        (v_item->>'data_interacao')::timestamptz,
        (v_item->>'interaction_date')::timestamptz,
        NOW()
      );
      
      INSERT INTO interactions (
        company_id, contact_id, type, channel, direction, 
        resumo, content, user_id, data_interacao
      ) VALUES (
        (v_item->>'company_id')::uuid,
        (v_item->>'contact_id')::uuid,
        COALESCE(v_item->>'type', 'note'),
        COALESCE(v_item->>'channel', 'system'),
        COALESCE(v_item->>'direction', 'outbound'),
        COALESCE(v_item->>'summary', v_item->>'resumo'),
        v_item->>'content',
        (v_item->>'user_id')::uuid,
        v_interaction_date
      );
      v_created := v_created + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || jsonb_build_object('item', v_item, 'error', SQLERRM);
    END;
  END LOOP;
  
  RETURN jsonb_build_object('created', v_created, 'errors', v_errors);
END;
$function$
