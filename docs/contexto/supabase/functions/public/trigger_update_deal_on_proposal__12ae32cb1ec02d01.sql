CREATE OR REPLACE FUNCTION public.trigger_update_deal_on_proposal()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'aceita' AND NEW.deal_id IS NOT NULL THEN
    UPDATE deals SET 
      status = 'ganho', 
      closed_at = NOW(), 
      updated_at = NOW(),
      valor = NEW.valor_final
    WHERE id = NEW.deal_id;
  ELSIF NEW.status = 'rejeitada' AND NEW.deal_id IS NOT NULL THEN
    UPDATE deals SET 
      status = 'perdido', 
      closed_at = NOW(), 
      updated_at = NOW(),
      motivo_perda = NEW.motivo_rejeicao
    WHERE id = NEW.deal_id;
  END IF;
  RETURN NEW;
END;
$function$
