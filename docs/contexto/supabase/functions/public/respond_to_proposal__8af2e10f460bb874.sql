CREATE OR REPLACE FUNCTION public.respond_to_proposal(p_proposal_id uuid, p_accepted boolean, p_motivo text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE proposals SET
    status          = CASE WHEN p_accepted THEN 'aceita' ELSE 'rejeitada' END,
    data_resposta   = NOW(),
    motivo_rejeicao = CASE WHEN NOT p_accepted THEN p_motivo ELSE NULL END,
    updated_at      = NOW()
  WHERE id = p_proposal_id
    AND status IN ('enviada', 'visualizada')
    AND (auth.uid() IS NULL OR user_id = auth.uid());

  IF p_accepted AND FOUND THEN
    UPDATE deals
    SET status     = 'ganho',
        closed_at  = NOW(),
        updated_at = NOW()
    WHERE id = (SELECT deal_id FROM proposals WHERE id = p_proposal_id)
      AND (auth.uid() IS NULL OR user_id = auth.uid());
  END IF;

  RETURN FOUND;
END;
$function$
