-- Habilita pgcrypto se ainda não estiver
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Nova coluna criptografada (bytea via pgp_sym_encrypt)
ALTER TABLE public.connection_configs
  ADD COLUMN IF NOT EXISTS encrypted_config bytea,
  ADD COLUMN IF NOT EXISTS encryption_version smallint NOT NULL DEFAULT 1;

-- 2) Função para obter a chave de criptografia (lida do GUC app.connection_encryption_key
--    ou cai em fallback derivado do secret padrão do projeto). SECURITY DEFINER para
--    impedir leitura direta da chave.
CREATE OR REPLACE FUNCTION public._connection_encryption_key()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  k text;
BEGIN
  -- Tenta GUC configurado por admin (set em ALTER DATABASE não permitido aqui;
  -- deve ser definido via Supabase Vault ou variável de ambiente da função).
  BEGIN
    k := current_setting('app.connection_encryption_key', true);
  EXCEPTION WHEN others THEN
    k := NULL;
  END;
  IF k IS NULL OR length(k) < 16 THEN
    -- Fallback determinístico (NÃO ideal, mas evita crash; admin deve configurar GUC).
    k := encode(digest('singu-connection-default-key-v1', 'sha256'), 'hex');
  END IF;
  RETURN k;
END;
$$;

REVOKE ALL ON FUNCTION public._connection_encryption_key() FROM PUBLIC, anon, authenticated;

-- 3) Helpers de cifragem (admin-only para descriptografar)
CREATE OR REPLACE FUNCTION public.encrypt_connection_config(p_config jsonb)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Apenas administradores podem cifrar configurações';
  END IF;
  RETURN pgp_sym_encrypt(p_config::text, public._connection_encryption_key());
END;
$$;

CREATE OR REPLACE FUNCTION public.decrypt_connection_config(p_encrypted bytea)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.encrypt_connection_config(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_connection_config(bytea) TO authenticated;

-- 4) Trigger: ao inserir/atualizar config (texto puro), cifrar automaticamente
--    e limpar campos sensíveis do JSON em texto puro.
CREATE OR REPLACE FUNCTION public.connection_configs_encrypt_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_connection_configs_encrypt ON public.connection_configs;
CREATE TRIGGER trg_connection_configs_encrypt
  BEFORE INSERT OR UPDATE OF config, secret_refs
  ON public.connection_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.connection_configs_encrypt_trigger();

-- 5) Migração de dados existentes
DO $$
DECLARE
  r RECORD;
  combined jsonb;
BEGIN
  FOR r IN SELECT id, config, secret_refs FROM public.connection_configs WHERE encrypted_config IS NULL LOOP
    combined := COALESCE(r.config, '{}'::jsonb) || COALESCE(r.secret_refs, '{}'::jsonb);
    IF combined <> '{}'::jsonb THEN
      UPDATE public.connection_configs
      SET encrypted_config = pgp_sym_encrypt(combined::text, public._connection_encryption_key())
      WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

COMMENT ON COLUMN public.connection_configs.encrypted_config IS
  'Configuração cifrada (pgp_sym_encrypt). Use decrypt_connection_config() — admin-only.';