BEGIN;
DO $test$
DECLARE
  uid uuid;
  user_email text;
  metadata jsonb;
  saved record;
BEGIN
  FOR metadata IN SELECT value FROM jsonb_array_elements(
    '[{"first_name":"Contrato","last_name":"Perfil"},{},null]'::jsonb
  ) LOOP
    uid := gen_random_uuid();
    user_email := format('rls-profile-%s@promobrindes.com.br', uid);
    INSERT INTO auth.users(id, email, raw_user_meta_data)
      VALUES(uid, user_email, NULLIF(metadata, 'null'::jsonb));
    SELECT id, email, first_name, last_name INTO saved FROM public.profiles WHERE id = uid;
    IF NOT FOUND OR saved.email IS DISTINCT FROM user_email
      OR saved.first_name IS DISTINCT FROM metadata->>'first_name'
      OR saved.last_name IS DISTINCT FROM metadata->>'last_name' THEN
      RAISE EXCEPTION 'Cadastro não criou o perfil com o email e os nomes do usuário';
    END IF;
  END LOOP;
  IF has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE') THEN
    RAISE EXCEPTION 'Gatilho de cadastro exposto como RPC';
  END IF;
END;
$test$;
SELECT 'signup_profile_contract: OK' AS result;
ROLLBACK;
