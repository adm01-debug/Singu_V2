CREATE OR REPLACE FUNCTION public.connection_configs_encrypt_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  sensitive_keys text[] := ARRAY['token','api_key','apiKey','secret','password','service_role_key','webhook_secret'];
  k text;
  combined jsonb;
BEGIN
  -- Mescla config + secret_refs para cifrar tudo junto
  combined := COALESCE(NEW.config, '{}'::jsonb) || COALESCE(NEW.secret_refs, '{}'::jsonb);
  IF combined <> '{}'::jsonb THEN
    NEW.encrypted_config := pgp_sym_encrypt(combined::text, public._connection_encryption_key());
  END IF;

  -- Remove valores sensíveis da coluna `config` em texto puro (mantém estrutura/keys vazias)
  IF NEW.config IS NOT NULL THEN
    FOREACH k IN ARRAY sensitive_keys LOOP
      IF NEW.config ? k THEN
        NEW.config := jsonb_set(NEW.config, ARRAY[k], '"***"'::jsonb, false);
      END IF;
    END LOOP;
  END IF;

  -- Limpa secret_refs (não persiste em texto puro)
  NEW.secret_refs := '{}'::jsonb;
  NEW.encryption_version := 1;

  RETURN NEW;
END;
$function$
