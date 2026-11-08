CREATE OR REPLACE FUNCTION public.sequence_event_to_intent_signal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  _signal_type TEXT;
  _weight NUMERIC := 1;
  _contact_id UUID;
  _user_id UUID;
BEGIN
  -- Map event_type to signal_type
  _signal_type := CASE NEW.event_type
    WHEN 'open' THEN 'email_open'
    WHEN 'opened' THEN 'email_open'
    WHEN 'click' THEN 'email_click'
    WHEN 'clicked' THEN 'email_click'
    WHEN 'reply' THEN 'email_reply'
    WHEN 'replied' THEN 'email_reply'
    WHEN 'completed' THEN 'sequence_completed'
    ELSE NULL
  END;

  IF _signal_type IS NULL THEN
    RETURN NEW;
  END IF;

  _weight := CASE _signal_type
    WHEN 'email_reply' THEN 3
    WHEN 'email_click' THEN 2
    WHEN 'sequence_completed' THEN 2
    ELSE 1
  END;

  -- Resolve contact + user via enrollment
  SELECT e.contact_id, e.user_id INTO _contact_id, _user_id
  FROM public.sequence_enrollments e
  WHERE e.id = NEW.enrollment_id
  LIMIT 1;

  IF _contact_id IS NULL OR _user_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.intent_signals (user_id, contact_id, signal_type, source, weight, occurred_at, metadata)
  VALUES (_user_id, _contact_id, _signal_type, 'sequence', _weight, COALESCE(NEW.created_at, now()),
          jsonb_build_object('enrollment_id', NEW.enrollment_id, 'event_type', NEW.event_type, 'sequence_event_id', NEW.id));

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Fail-safe: nunca quebrar a inserção do evento original
  RETURN NEW;
END;
$function$
