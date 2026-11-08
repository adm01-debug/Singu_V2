CREATE OR REPLACE FUNCTION public.auto_update_relationship_stage()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  NEW.relationship_stage := CASE
    WHEN NEW.relationship_score >= 80 THEN 'advocate'
    WHEN NEW.relationship_score >= 60 THEN 'customer'
    WHEN NEW.relationship_score >= 40 THEN 'opportunity'
    WHEN NEW.relationship_score >= 20 THEN 'qualified_lead'
    WHEN NEW.relationship_score >= 1 THEN 'prospect'
    ELSE COALESCE(NEW.relationship_stage, 'unknown')
  END;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$
