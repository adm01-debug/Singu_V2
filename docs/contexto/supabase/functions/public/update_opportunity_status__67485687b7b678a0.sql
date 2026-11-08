CREATE OR REPLACE FUNCTION public.update_opportunity_status(p_opportunity_id uuid, p_status text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_opportunity_access(p_opportunity_id);
  UPDATE sales_opportunities
  SET status = p_status,
      notes = COALESCE(p_notes, notes),
      updated_at = now()
  WHERE id = p_opportunity_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'opportunity_id', p_opportunity_id,
    'new_status', p_status
  );
END;
$function$
