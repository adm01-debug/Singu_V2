CREATE OR REPLACE FUNCTION public.update_contact(p_contact_id uuid, p_data jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  result   jsonb;
  affected int;
BEGIN
  -- full_name é GENERATED: aceitamos 'full_name' (divide) ou 'first_name'/'last_name' diretos
  UPDATE contacts SET
    first_name = COALESCE(
      CASE WHEN p_data ? 'full_name'
           THEN split_part(TRIM(p_data->>'full_name'), ' ', 1)
           ELSE p_data->>'first_name' END,
      first_name),
    last_name  = COALESCE(
      CASE WHEN p_data ? 'full_name'
           THEN NULLIF(TRIM(regexp_replace(TRIM(p_data->>'full_name'), '^\S*\s*', '')), '')
           ELSE p_data->>'last_name' END,
      last_name),
    email      = COALESCE(p_data->>'email',     email),
    phone      = COALESCE(p_data->>'telefone',  phone),
    cargo      = COALESCE(p_data->>'cargo',     cargo),
    whatsapp   = COALESCE(p_data->>'whatsapp',  whatsapp),
    updated_at = now()
  WHERE id = p_contact_id
    AND deleted_at IS NULL
    AND (auth.uid() IS NULL OR user_id = auth.uid());
  GET DIAGNOSTICS affected = ROW_COUNT;

  IF affected = 0 THEN
    result := jsonb_build_object('success', false, 'message', 'Contato não encontrado ou acesso negado');
  ELSE
    result := jsonb_build_object('success', true, 'contact_id', p_contact_id, 'message', 'Contato atualizado');
  END IF;
  RETURN result;
END;
$function$
