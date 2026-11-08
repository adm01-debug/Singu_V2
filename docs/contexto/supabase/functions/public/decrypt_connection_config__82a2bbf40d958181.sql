CREATE OR REPLACE FUNCTION public.decrypt_connection_config(p_encrypted bytea)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  plain text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem descriptografar configurações';
  END IF;
  IF p_encrypted IS NULL THEN RETURN NULL; END IF;
  plain := pgp_sym_decrypt(p_encrypted, public._connection_encryption_key());
  RETURN plain::jsonb;
END;
$function$
