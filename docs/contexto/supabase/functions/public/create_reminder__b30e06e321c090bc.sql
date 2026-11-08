CREATE OR REPLACE FUNCTION public.create_reminder(p_user_id uuid, p_title text, p_reminder_date timestamp with time zone, p_company_id uuid DEFAULT NULL::uuid, p_contact_id uuid DEFAULT NULL::uuid, p_deal_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE v_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  PERFORM public.assert_self_user_id(p_user_id);
  -- o canônico não tem contact_id/deal_id em reminders; os ids opcionais ficam em notes
  -- priority precisa vir de chk_reminders_priority (alta/media/baixa/urgente); o default 'medium' viola o check
  INSERT INTO reminders (user_id, title, reminder_date, company_id, priority, notes)
  VALUES (p_user_id, p_title, p_reminder_date, p_company_id, 'media',
          concat_ws(' ',
            CASE WHEN p_contact_id IS NOT NULL THEN 'contact_id=' || p_contact_id END,
            CASE WHEN p_deal_id IS NOT NULL THEN 'deal_id=' || p_deal_id END))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$function$
