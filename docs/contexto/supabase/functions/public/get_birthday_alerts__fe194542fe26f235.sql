CREATE OR REPLACE FUNCTION public.get_birthday_alerts(p_days_ahead integer DEFAULT 7, p_user_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(contact_id uuid, contact_name text, company_id uuid, company_name text, birthday date, days_until integer, cargo text)
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.assert_self_user_id(p_user_id);
  RETURN QUERY
  SELECT 
    ct.id,
    ct.full_name,
    ct.company_id,
    c.nome_fantasia::TEXT,
    ct.birthday,
    (ct.birthday - CURRENT_DATE + 
      CASE WHEN ct.birthday < CURRENT_DATE 
        THEN DATE_TRUNC('year', CURRENT_DATE)::DATE - DATE_TRUNC('year', ct.birthday)::DATE + 365
        ELSE 0 
      END
    )::INT,
    ct.cargo
  FROM contacts ct
  JOIN companies c ON c.id = ct.company_id
  WHERE ct.birthday IS NOT NULL
    AND ct.deleted_at IS NULL
    AND c.deleted_at IS NULL
    AND (p_user_id IS NULL OR ct.user_id = p_user_id)
    AND (
      (EXTRACT(MONTH FROM ct.birthday) = EXTRACT(MONTH FROM CURRENT_DATE) 
       AND EXTRACT(DAY FROM ct.birthday) BETWEEN EXTRACT(DAY FROM CURRENT_DATE) AND EXTRACT(DAY FROM CURRENT_DATE) + p_days_ahead)
      OR
      (EXTRACT(MONTH FROM ct.birthday) = EXTRACT(MONTH FROM CURRENT_DATE + p_days_ahead::INT) 
       AND EXTRACT(DAY FROM ct.birthday) <= EXTRACT(DAY FROM CURRENT_DATE + p_days_ahead::INT))
    )
  ORDER BY EXTRACT(MONTH FROM ct.birthday), EXTRACT(DAY FROM ct.birthday);
END;
$function$
