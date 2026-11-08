CREATE OR REPLACE FUNCTION public.get_competitor_profile(p_competitor_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_competitor competitors%ROWTYPE;
BEGIN
  SELECT * INTO v_competitor FROM competitors WHERE id = p_competitor_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Concorrente não encontrado');
  END IF;
  
  RETURN jsonb_build_object(
    'competitor', row_to_json(v_competitor),
    'losses_30d', (SELECT COUNT(*) FROM competitive_losses WHERE competitor_id = p_competitor_id AND created_at >= CURRENT_DATE - 30),
    'losses_90d', (SELECT COUNT(*) FROM competitive_losses WHERE competitor_id = p_competitor_id AND created_at >= CURRENT_DATE - 90),
    'value_lost_90d', (
      SELECT COALESCE(SUM(d.valor), 0) 
      FROM competitive_losses cl 
      JOIN deals d ON d.id = cl.deal_id 
      WHERE cl.competitor_id = p_competitor_id AND cl.created_at >= CURRENT_DATE - 90
    ),
    'common_reasons', (
      SELECT COALESCE(jsonb_agg(r), '[]')
      FROM (
        SELECT loss_reason, COUNT(*) as count
        FROM competitive_losses
        WHERE competitor_id = p_competitor_id AND loss_reason IS NOT NULL
        GROUP BY loss_reason
        ORDER BY COUNT(*) DESC
        LIMIT 5
      ) r
    ),
    'recent_losses', (
      SELECT COALESCE(jsonb_agg(l), '[]')
      FROM (
        SELECT cl.id, c.nome_crm as company_name, d.valor, cl.loss_reason, cl.created_at
        FROM competitive_losses cl
        JOIN companies c ON c.id = cl.company_id
        JOIN deals d ON d.id = cl.deal_id
        WHERE cl.competitor_id = p_competitor_id
        ORDER BY cl.created_at DESC
        LIMIT 10
      ) l
    )
  );
END;
$function$
