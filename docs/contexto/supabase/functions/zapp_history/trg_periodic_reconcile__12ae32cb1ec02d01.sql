CREATE OR REPLACE FUNCTION zapp_history.trg_periodic_reconcile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'zapp_history', 'public', 'pg_temp'
AS $function$
BEGIN
  -- A cada 5 mensagens novas, dispara reconcile (não bloqueia, fire-and-forget via pg_net interno)
  IF (NEW.id::text)::uuid IS NOT NULL AND random() < 0.2 THEN
    PERFORM zapp_history.reconcile_nlp_responses();
  END IF;
  RETURN NEW;
END;
$function$
