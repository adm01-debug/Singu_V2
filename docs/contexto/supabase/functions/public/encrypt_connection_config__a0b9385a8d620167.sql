CREATE OR REPLACE FUNCTION public.encrypt_connection_config(p_config jsonb)
 RETURNS bytea
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem cifrar configurações';
  END IF;
  RETURN pgp_sym_encrypt(p_config::text, public._connection_encryption_key());
END;
$function$
