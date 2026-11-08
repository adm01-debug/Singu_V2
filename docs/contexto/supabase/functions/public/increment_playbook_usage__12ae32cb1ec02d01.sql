CREATE OR REPLACE FUNCTION public.increment_playbook_usage()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.playbook_id IS NOT NULL AND NEW.action IN ('opened','used_in_deal') THEN
    UPDATE public.sales_playbooks
    SET usage_count = usage_count + 1
    WHERE id = NEW.playbook_id;
  END IF;
  RETURN NEW;
END;
$function$
