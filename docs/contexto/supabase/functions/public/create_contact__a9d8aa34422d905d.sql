CREATE OR REPLACE FUNCTION public.create_contact(p_company_id uuid, p_full_name text, p_email text DEFAULT NULL::text, p_telefone text DEFAULT NULL::text, p_cargo text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  new_id uuid;
BEGIN
  PERFORM public.assert_company_access(p_company_id);
  -- Verificar se empresa existe
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = p_company_id AND deleted_at IS NULL) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Empresa não encontrada');
  END IF;

  -- full_name é GENERATED (first_name + last_name): dividimos o nome recebido
  INSERT INTO contacts (company_id, first_name, last_name, email, phone, cargo, whatsapp, user_id)
  VALUES (
    p_company_id,
    split_part(TRIM(p_full_name), ' ', 1),
    NULLIF(TRIM(regexp_replace(TRIM(p_full_name), '^\S*\s*', '')), ''),
    p_email, p_telefone, p_cargo, p_whatsapp, auth.uid()
  )
  RETURNING id INTO new_id;

  SELECT jsonb_build_object(
    'success', true,
    'contact_id', new_id,
    'company_id', p_company_id,
    'message', 'Contato criado com sucesso'
  ) INTO result;

  RETURN result;
END;
$function$
