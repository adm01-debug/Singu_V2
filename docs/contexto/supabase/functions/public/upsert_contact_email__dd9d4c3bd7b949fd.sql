CREATE OR REPLACE FUNCTION public.upsert_contact_email(p_contact_id uuid, p_email character varying, p_email_type email_type DEFAULT NULL::email_type, p_is_primary boolean DEFAULT NULL::boolean, p_fonte character varying DEFAULT NULL::character varying, p_observacao text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO contact_emails (contact_id, email, email_type, is_primary, fonte, contexto)
  VALUES (p_contact_id, p_email, p_email_type, p_is_primary, p_fonte, p_observacao)
  ON CONFLICT (contact_id, LOWER(email)) DO UPDATE SET
    updated_at = NOW(),
    fonte = COALESCE(EXCLUDED.fonte, contact_emails.fonte),
    contexto = COALESCE(EXCLUDED.contexto, contact_emails.contexto),
    is_primary = COALESCE(EXCLUDED.is_primary, contact_emails.is_primary)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$
