CREATE OR REPLACE FUNCTION public.create_reactivation_campaign(p_name text, p_days integer DEFAULT 60)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_cnt int; v_val numeric;
BEGIN
  SELECT COUNT(*), COALESCE(SUM((SELECT SUM(d.valor) FROM deals d WHERE d.company_id = c.id AND d.status = 'ganho')), 0) INTO v_cnt, v_val
  FROM companies c WHERE c.is_customer = true AND c.deleted_at IS NULL
    AND NOT EXISTS (SELECT 1 FROM interactions i WHERE i.company_id = c.id AND i.data_interacao >= NOW() - (p_days || ' days')::interval);
  RETURN jsonb_build_object('campaign', p_name, 'candidates', v_cnt, 'value', v_val);
END;
$function$
