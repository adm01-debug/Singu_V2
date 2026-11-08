CREATE OR REPLACE FUNCTION public.populate_campaign_from_segment(p_campaign_id uuid, p_segment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_count int := 0;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  INSERT INTO campaign_members (campaign_id, company_id)
  SELECT p_campaign_id, c.id
  FROM companies c
  WHERE c.deleted_at IS NULL AND c.status = 'ativo'
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object('success', true, 'members_added', v_count);
END;
$function$
