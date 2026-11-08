CREATE OR REPLACE FUNCTION public.update_campaign_metrics(p_campaign_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_campaign record;
  v_total int;
  v_contacted int;
  v_responded int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  SELECT * INTO v_campaign FROM campaigns WHERE id = p_campaign_id;
  
  IF v_campaign IS NULL THEN
    RETURN jsonb_build_object('error', 'Campaign not found');
  END IF;
  
  -- Conta empresas segmentadas
  SELECT COUNT(*) INTO v_total
  FROM segment_companies_for_campaign(v_campaign.target_segment);
  
  -- Atualiza
  UPDATE campaigns SET
    total_targets = v_total,
    updated_at = NOW()
  WHERE id = p_campaign_id;
  
  RETURN jsonb_build_object(
    'campaign_id', p_campaign_id,
    'total_targets', v_total,
    'contacted', v_campaign.contacted,
    'responded', v_campaign.responded,
    'converted', v_campaign.converted,
    'contact_rate', ROUND(v_campaign.contacted::numeric / NULLIF(v_total, 0) * 100, 2),
    'response_rate', ROUND(v_campaign.responded::numeric / NULLIF(v_campaign.contacted, 0) * 100, 2),
    'conversion_rate', ROUND(v_campaign.converted::numeric / NULLIF(v_campaign.responded, 0) * 100, 2)
  );
EXCEPTION WHEN undefined_table THEN
  RETURN jsonb_build_object('error', 'Tables not initialized');
END;
$function$
