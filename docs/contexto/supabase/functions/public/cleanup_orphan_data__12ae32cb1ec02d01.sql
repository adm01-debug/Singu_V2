CREATE OR REPLACE FUNCTION public.cleanup_orphan_data()
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb := '{}'::jsonb;
  v_count int;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  -- Limpar contact_emails sem contato válido
  DELETE FROM contact_emails WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = contact_emails.contact_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('contact_emails_deleted', v_count);
  
  -- Limpar contact_phones sem contato válido
  DELETE FROM contact_phones WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = contact_phones.contact_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('contact_phones_deleted', v_count);
  
  -- Limpar company_emails sem empresa válida
  DELETE FROM company_emails WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = company_emails.company_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('company_emails_deleted', v_count);
  
  -- Limpar company_phones sem empresa válida
  DELETE FROM company_phones WHERE NOT EXISTS (SELECT 1 FROM companies WHERE id = company_phones.company_id);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  v_result := v_result || jsonb_build_object('company_phones_deleted', v_count);
  
  RETURN v_result || jsonb_build_object('executed_at', NOW());
END;
$function$
