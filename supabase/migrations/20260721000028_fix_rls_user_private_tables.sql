-- SECURITY FIX: Replace auth.uid() IS NOT NULL policies with auth.uid() = user_id
-- on all tables holding user-private operational data.
-- Affected: contact_notes, custom_field_values, custom_fields, documents, meetings,
--           proposals, purchase_history, quick_notes, reminders, user_badges,
--           user_goals, whatsapp_instances, whatsapp_messages, automations.

DO $migration$
DECLARE
  table_definition record;
  old_policy text;
  policy_definition record;
  policy_prefix text;
  predicate text;
  ddl text;
BEGIN
  FOR table_definition IN
    SELECT *
    FROM (VALUES
      ('contact_notes', 'user_id', ARRAY['Users can delete own notes', 'Users can insert own notes', 'Users can read own notes', 'Users can update own notes']),
      ('custom_fields', 'user_id', ARRAY['custom_fields_all']),
      ('custom_field_values', 'user_id', ARRAY['custom_field_values_all']),
      ('documents', 'user_id', ARRAY['documents_all']),
      ('meetings', 'user_id', ARRAY['meetings_all']),
      ('proposals', 'user_id', ARRAY['proposals_select_policy', 'proposals_insert_policy', 'proposals_update_policy']),
      ('purchase_history', 'user_id', ARRAY['purchase_history_all']),
      ('quick_notes', 'user_id', ARRAY['quick_notes_all']),
      ('reminders', 'user_id', ARRAY['reminders_all']),
      ('user_badges', 'user_id', ARRAY['user_badges_all']),
      ('user_goals', 'user_id', ARRAY['user_goals_all']),
      ('whatsapp_instances', 'user_id', ARRAY['whatsapp_instances_all']),
      ('whatsapp_messages', 'user_id', ARRAY['whatsapp_messages_all']),
      ('automations', 'created_by', ARRAY['automations_all'])
    ) AS tables(table_name, owner_column, old_policies)
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', table_definition.table_name))
        AND attname = table_definition.owner_column
        AND NOT attisdropped
    ) THEN
      CONTINUE;
    END IF;

    FOREACH old_policy IN ARRAY table_definition.old_policies
    LOOP
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        old_policy,
        table_definition.table_name
      );
    END LOOP;

    policy_prefix := table_definition.table_name;
    predicate := format('auth.uid() = %I', table_definition.owner_column);

    FOR policy_definition IN
      SELECT *
      FROM (VALUES
        ('select', 'SELECT', true, false),
        ('insert', 'INSERT', false, true),
        ('update', 'UPDATE', true, true),
        ('delete', 'DELETE', true, false)
      ) AS policies(policy_suffix, action, has_using, has_check)
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = to_regclass(format('public.%I', table_definition.table_name))
          AND polname = policy_prefix || '_' || policy_definition.policy_suffix
      ) THEN
        ddl := format(
          'CREATE POLICY %I ON public.%I FOR %s',
          policy_prefix || '_' || policy_definition.policy_suffix,
          table_definition.table_name,
          policy_definition.action
        );

        IF policy_definition.has_using THEN
          ddl := ddl || format(' USING (%s)', predicate);
        END IF;
        IF policy_definition.has_check THEN
          ddl := ddl || format(' WITH CHECK (%s)', predicate);
        END IF;

        EXECUTE ddl;
      END IF;
    END LOOP;
  END LOOP;
END;
$migration$;
