-- Cadastro no Singu era aberto: /auth chama supabase.auth.signUp e o emailSchema do front
-- não valida domínio, então qualquer pessoa da internet podia criar conta e virar `authenticated`
-- (o que dá acesso a customers/contact_phones/company_phones, hoje abertos para qualquer logado).
-- Os 14 logins existentes serem todos @promobrindes.com.br é acaso operacional, não controle.
-- O toggle "allow new users to sign up" só existe no painel; isto é o equivalente no banco,
-- e melhor: fica configurável sem deploy, na mesma tabela do kill switch do rodízio.

DO $migration$
BEGIN
  IF to_regclass('public.config_regras_negocio') IS NOT NULL THEN
    INSERT INTO public.config_regras_negocio (chave, valor, descricao, updated_at)
    VALUES (
      'DOMINIOS_SIGNUP_PERMITIDOS',
      'promobrindes.com.br',
      'Domínios de e-mail autorizados a criar conta (separados por vírgula). Vazio = bloqueia todos.',
      now()
    )
    ON CONFLICT (chave) DO NOTHING;

    CREATE OR REPLACE FUNCTION public.fn_valida_dominio_signup()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public', 'pg_temp'
    AS $function$
    DECLARE
      v_dominios text;
      v_dominio_email text;
    BEGIN
      SELECT valor INTO v_dominios FROM public.config_regras_negocio
       WHERE chave = 'DOMINIOS_SIGNUP_PERMITIDOS';

      -- Fail-closed de propósito: sem config, ninguém novo entra. Não afeta login de quem já existe
      -- (login não faz INSERT em auth.users), então o pior caso é cadastro bloqueado, nunca empresa parada.
      v_dominio_email := lower(split_part(COALESCE(NEW.email, ''), '@', 2));

      IF v_dominio_email = '' OR NOT (
        v_dominio_email = ANY (
          SELECT btrim(lower(d)) FROM unnest(string_to_array(COALESCE(v_dominios, ''), ',')) AS d
          WHERE btrim(d) <> ''
        )
      ) THEN
        RAISE EXCEPTION 'Cadastro não autorizado para este e-mail. Fale com o administrador do Singu.'
          USING ERRCODE = 'check_violation';
      END IF;

      RETURN NEW;
    END;
    $function$;

    REVOKE ALL ON FUNCTION public.fn_valida_dominio_signup() FROM PUBLIC, anon, authenticated;

    DROP TRIGGER IF EXISTS trg_valida_dominio_signup ON auth.users;
    CREATE TRIGGER trg_valida_dominio_signup
      BEFORE INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.fn_valida_dominio_signup();
  END IF;
END;
$migration$;
