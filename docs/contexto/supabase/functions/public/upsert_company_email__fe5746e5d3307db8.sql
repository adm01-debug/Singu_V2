CREATE OR REPLACE FUNCTION public.upsert_company_email(p_company_id uuid, p_email character varying, p_email_type email_type DEFAULT NULL::email_type, p_is_primary boolean DEFAULT NULL::boolean, p_fonte character varying DEFAULT NULL::character varying, p_observacao text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO company_emails (company_id, email, email_type, is_primary, fonte, observacao)
  VALUES (p_company_id, p_email, p_email_type, p_is_primary, p_fonte, p_observacao)
  ON CONFLICT (company_id, LOWER(email)) DO UPDATE SET
    updated_at = NOW(),
    fonte = COALESCE(EXCLUDED.fonte, company_emails.fonte),
    observacao = COALESCE(EXCLUDED.observacao, company_emails.observacao),
    is_primary = COALESCE(EXCLUDED.is_primary, company_emails.is_primary)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$
