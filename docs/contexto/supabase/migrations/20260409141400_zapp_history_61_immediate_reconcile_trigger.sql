-- Trigger que dispara reconcile a cada N inserts em messages
CREATE OR REPLACE FUNCTION zapp_history.trg_periodic_reconcile()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $fn$
BEGIN
  -- A cada 5 mensagens novas, dispara reconcile (não bloqueia, fire-and-forget via pg_net interno)
  IF (NEW.id::text)::uuid IS NOT NULL AND random() < 0.2 THEN
    PERFORM zapp_history.reconcile_nlp_responses();
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_msg_periodic_reconcile ON zapp_history.messages;
CREATE TRIGGER trg_msg_periodic_reconcile
  AFTER INSERT ON zapp_history.messages
  FOR EACH ROW EXECUTE FUNCTION zapp_history.trg_periodic_reconcile();
