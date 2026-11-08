CREATE OR REPLACE FUNCTION public.update_contact_relationship_metrics()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  last_interaction_date timestamptz;
  avg_sentiment text;
BEGIN
  IF NEW.contact_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT max(created_at)
  INTO last_interaction_date
  FROM public.interactions
  WHERE contact_id = NEW.contact_id;

  SELECT sentiment
  INTO avg_sentiment
  FROM (
    SELECT sentiment, count(*) AS cnt
    FROM public.interactions
    WHERE contact_id = NEW.contact_id
      AND sentiment IS NOT NULL
    GROUP BY sentiment
    ORDER BY cnt DESC, max(created_at) DESC
    LIMIT 1
  ) sub;

  UPDATE public.contacts
  SET
    sentiment = COALESCE(avg_sentiment, 'neutral'),
    last_interaction_at = last_interaction_date,
    updated_at = now()
  WHERE id = NEW.contact_id;

  RETURN NEW;
END;
$function$
