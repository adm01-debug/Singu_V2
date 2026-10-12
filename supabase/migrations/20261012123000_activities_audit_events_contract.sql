ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS reason text;
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS metadata jsonb;

DO $events$
DECLARE
  predicate text;
  event_type text;
  accepted boolean;
  event_types text[] := ARRAY[
    'contact_created', 'contact_updated', 'contact_deleted', 'contact_viewed',
    'company_created', 'company_updated', 'company_deleted', 'company_viewed',
    'interaction_created', 'interaction_updated', 'interaction_deleted',
    'contact_merged', 'call_made', 'message_sent', 'email_sent', 'meeting_scheduled',
    'note_added', 'disc_analyzed', 'sentiment_analyzed', 'emotion_analyzed',
    'alert_created', 'alert_actioned', 'alert_dismissed', 'login', 'logout',
    'settings_changed', 'export_data', 'import_data'
  ];
BEGIN
  SELECT pg_get_expr(conbin, conrelid) INTO predicate
  FROM pg_constraint
  WHERE conrelid = 'public.activities'::regclass AND conname = 'activities_type_check';
  IF predicate IS NULL THEN RETURN; END IF;

  FOREACH event_type IN ARRAY event_types LOOP
    EXECUTE format('SELECT (%s) FROM (SELECT $1::text AS type) AS event', predicate)
      INTO accepted USING event_type;
    IF accepted THEN CONTINUE; END IF;
    ALTER TABLE public.activities DROP CONSTRAINT activities_type_check;
    EXECUTE format(
      'ALTER TABLE public.activities ADD CONSTRAINT activities_type_check CHECK ((%s) OR type = ANY(%L::text[]))',
      predicate, event_types
    );
    RETURN;
  END LOOP;
END;
$events$;

-- Rollback: somente para a reconstrução legada cuja constraint anterior aceitava os sete eventos abaixo.
-- No banco canônico a constraint já aceita os eventos atuais e permanece inalterada.
-- As colunas adicionais permanecem para preservar os dados. O rollback falha sem remover linhas
-- se já houver eventos atuais; restaurar primeiro o código e arquivar esses eventos com backup.
-- BEGIN;
-- ALTER TABLE public.activities DROP CONSTRAINT activities_type_check;
-- ALTER TABLE public.activities ADD CONSTRAINT activities_type_check CHECK (type IN (
--   'company_created', 'contact_created', 'interaction_added', 'insight_generated',
--   'tag_added', 'profile_updated', 'alert_triggered'
-- ));
-- COMMIT;
