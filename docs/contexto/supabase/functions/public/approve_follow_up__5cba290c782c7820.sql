CREATE OR REPLACE FUNCTION public.approve_follow_up(p_approval_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  affected int;
BEGIN
  UPDATE follow_up_approvals
  SET status = 'approved', approved_at = NOW(), updated_at = NOW()
  WHERE id = p_approval_id
    AND user_id = auth.uid()
    AND status = 'pending';
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Aprovação não encontrada ou já decidida');
  END IF;
  RETURN jsonb_build_object('success', true, 'approval_id', p_approval_id, 'status', 'approved');
END;
$function$
