CREATE OR REPLACE FUNCTION public.create_smart_reminder(p_user_id uuid, p_title character varying, p_remind_at timestamp with time zone, p_contact_id uuid DEFAULT NULL::uuid, p_description text DEFAULT NULL::text, p_reminder_type character varying DEFAULT 'custom'::character varying, p_priority character varying DEFAULT 'normal'::character varying, p_suggested_actions text[] DEFAULT NULL::text[])
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_reminder_id UUID;
    v_context     JSONB := '{}'::JSONB;
BEGIN
  PERFORM public.assert_contact_access(p_contact_id);
  PERFORM public.assert_self_user_id(p_user_id);

  IF p_contact_id IS NOT NULL THEN
      SELECT jsonb_build_object(
          'contact_name',       COALESCE(c.full_name, c.first_name || ' ' || c.last_name),
          'company',            COALESCE(co.nome_fantasia, co.razao_social, co.nome_crm),
          'disc_type',          da.primary_profile,
          'last_interaction',   (SELECT MAX(data_interacao) FROM interactions WHERE contact_id = c.id),
          'relationship_score', c.relationship_score
      ) INTO v_context
      FROM contacts c
      LEFT JOIN companies co ON c.company_id = co.id
      LEFT JOIN disc_assessments da ON c.id = da.contact_id AND da.is_current = true
      WHERE c.id = p_contact_id;
  END IF;

  INSERT INTO smart_reminders (
      user_id, reminder_type, contact_id, title, description,
      remind_at, priority, context_data, suggested_actions
  ) VALUES (
      p_user_id, p_reminder_type, p_contact_id, p_title, p_description,
      p_remind_at, p_priority, v_context,
      COALESCE(p_suggested_actions, ARRAY['Fazer contato', 'Enviar mensagem', 'Agendar reunião'])
  )
  RETURNING id INTO v_reminder_id;

  RETURN v_reminder_id;
END;
$function$
