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
$function$
