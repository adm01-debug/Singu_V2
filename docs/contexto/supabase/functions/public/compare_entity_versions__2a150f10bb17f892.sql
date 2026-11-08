CREATE OR REPLACE FUNCTION public.compare_entity_versions(p_entity_type text, p_entity_id uuid, p_version1_id uuid, p_version2_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_v1 record;
  v_v2 record;
  v_diff jsonb := '[]'::jsonb;
BEGIN
  SELECT * INTO v_v1 FROM entity_change_logs WHERE id = p_version1_id;
  SELECT * INTO v_v2 FROM entity_change_logs WHERE id = p_version2_id;
  
  IF v_v1 IS NULL OR v_v2 IS NULL THEN
    RETURN jsonb_build_object('error', 'Version not found');
  END IF;
  
  RETURN jsonb_build_object(
    'entity_type', p_entity_type,
    'entity_id', p_entity_id,
    'version1', jsonb_build_object(
      'id', v_v1.id,
      'action', v_v1.action,
      'data', v_v1.new_data,
      'date', v_v1.created_at
    ),
    'version2', jsonb_build_object(
      'id', v_v2.id,
      'action', v_v2.action,
      'data', v_v2.new_data,
      'date', v_v2.created_at
    )
  );
END;
$function$
