CREATE OR REPLACE FUNCTION public.trigger_notify_deal_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Notificar quando deal é ganho
  IF NEW.status = 'ganho' AND OLD.status != 'ganho' THEN
    PERFORM create_notification(
      NEW.user_id,
      'success',
      '🎉 Deal Fechado!',
      'O deal "' || NEW.titulo || '" foi ganho com valor de R$ ' || NEW.valor::text,
      'deal',
      NEW.id
    );
  END IF;
  
  -- Notificar quando deal é perdido
  IF NEW.status = 'perdido' AND OLD.status != 'perdido' THEN
    PERFORM create_notification(
      NEW.user_id,
      'warning',
      '❌ Deal Perdido',
      'O deal "' || NEW.titulo || '" foi marcado como perdido',
      'deal',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$function$
