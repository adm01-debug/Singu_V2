BEGIN;
DO $relations$
DECLARE
  actor_a uuid;
  actor_b uuid;
  actor_admin uuid;
  contact_a uuid;
  contact_b uuid;
  archived_a uuid;
  email_a uuid;
  phone_a uuid;
  changed integer;
BEGIN
  SELECT id INTO actor_admin FROM auth.users
    WHERE public.has_role(id, 'admin'::public.app_role) ORDER BY created_at LIMIT 1;
  IF actor_admin IS NULL THEN
    actor_admin := gen_random_uuid();
    INSERT INTO auth.users(id,email,raw_user_meta_data)
      VALUES (actor_admin, actor_admin::text || '@scope.example.invalid', '{"first_name":"Prova","last_name":"Admin"}');
    INSERT INTO public.user_roles(user_id,role) VALUES (actor_admin,'admin');
  END IF;
  SELECT id INTO actor_a FROM auth.users
    WHERE NOT public.has_role(id, 'admin'::public.app_role) ORDER BY created_at LIMIT 1;
  IF actor_a IS NULL THEN
    actor_a := gen_random_uuid();
    INSERT INTO auth.users(id,email,raw_user_meta_data)
      VALUES (actor_a, actor_a::text || '@scope.example.invalid', '{"first_name":"Prova","last_name":"A"}');
  END IF;
  SELECT id INTO actor_b FROM auth.users
    WHERE id <> actor_a AND NOT public.has_role(id, 'admin'::public.app_role)
    ORDER BY created_at LIMIT 1;
  IF actor_b IS NULL THEN
    actor_b := gen_random_uuid();
    INSERT INTO auth.users(id,email,raw_user_meta_data)
      VALUES (actor_b, actor_b::text || '@scope.example.invalid', '{"first_name":"Prova","last_name":"B"}');
  END IF;
  INSERT INTO public.contacts(first_name,last_name,user_id)
    VALUES ('Prova','A',actor_a) RETURNING id INTO contact_a;
  INSERT INTO public.contacts(first_name,last_name,user_id)
    VALUES ('Prova','B',actor_b) RETURNING id INTO contact_b;
  INSERT INTO public.contacts(first_name,last_name,user_id,deleted_at)
    VALUES ('Prova','Arquivada',actor_a,now()) RETURNING id INTO archived_a;
  PERFORM set_config('request.jwt.claim.sub',actor_a::text,true);
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub',actor_a,'role','authenticated','aal','aal1')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF current_user <> 'authenticated' OR public.has_role(actor_a, 'admin')
      OR public.has_role(actor_b, 'admin') THEN
    RAISE EXCEPTION 'Fixture de proprietário precisa executar como conta comum autenticada';
  END IF;
  INSERT INTO public.contact_emails(contact_id,email)
    VALUES (contact_a,'prova-dono@example.invalid') RETURNING id INTO email_a;
  INSERT INTO public.contact_phones(contact_id,numero)
    VALUES (contact_a,'(11) 99999-7000') RETURNING id INTO phone_a;
  UPDATE public.contact_phones SET numero='(11) 99999-7001' WHERE id=phone_a;
  IF NOT EXISTS (SELECT 1 FROM public.contact_phones
      WHERE id=phone_a AND numero_normalizado='11999997001') THEN
    RAISE EXCEPTION 'Telefone do proprietário não gravou normalizado';
  END IF;
  BEGIN
    UPDATE public.contact_emails SET contact_id=contact_b WHERE id=email_a;
    RAISE EXCEPTION 'Transferência de email entre contas permitida';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.contact_emails(contact_id,email) VALUES (archived_a,'arquivado@example.invalid');
    RAISE EXCEPTION 'Escrita em contato arquivado permitida';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub',actor_b::text,true);
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub',actor_b,'role','authenticated','aal','aal2')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF EXISTS (SELECT 1 FROM public.contact_emails WHERE id=email_a)
      OR EXISTS (SELECT 1 FROM public.contact_phones WHERE id=phone_a) THEN
    RAISE EXCEPTION 'Conta comum ainda consegue ler outra carteira';
  END IF;
  UPDATE public.contact_emails SET is_primary=true WHERE id=email_a;
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'Conta comum atualizou email alheio'; END IF;
  DELETE FROM public.contact_phones WHERE id=phone_a;
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed <> 0 THEN RAISE EXCEPTION 'Conta comum excluiu telefone alheio'; END IF;
  BEGIN
    INSERT INTO public.contact_emails(contact_id,email) VALUES (contact_a,'outra-conta@example.invalid');
    RAISE EXCEPTION 'Conta comum criou email alheio';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    INSERT INTO public.contact_phones(contact_id,numero) VALUES (contact_a,'11999997002');
    RAISE EXCEPTION 'Conta comum criou telefone alheio';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub',actor_admin::text,true);
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub',actor_admin,'role','authenticated','aal','aal1')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  IF EXISTS (SELECT 1 FROM public.contact_emails WHERE id=email_a)
      OR EXISTS (SELECT 1 FROM public.contact_phones WHERE id=phone_a) THEN
    RAISE EXCEPTION 'Administrador sem MFA atravessou carteira';
  END IF;
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub',actor_admin,'role','authenticated','aal','aal2')::text,true);
  IF NOT EXISTS (SELECT 1 FROM public.contact_emails WHERE id=email_a)
      OR NOT EXISTS (SELECT 1 FROM public.contact_phones WHERE id=phone_a) THEN
    RAISE EXCEPTION 'Administrador com MFA perdeu acesso legítimo';
  END IF;
  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claim.sub',actor_a::text,true);
  PERFORM set_config('request.jwt.claims',
    jsonb_build_object('sub',actor_a,'role','authenticated','aal','aal1')::text,true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  DELETE FROM public.contact_emails WHERE id=email_a;
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Proprietário não conseguiu excluir email'; END IF;
  DELETE FROM public.contact_phones WHERE id=phone_a;
  GET DIAGNOSTICS changed=ROW_COUNT;
  IF changed <> 1 THEN RAISE EXCEPTION 'Proprietário não conseguiu excluir telefone'; END IF;
  EXECUTE 'RESET ROLE';
END;
$relations$;
SELECT 'contact_relations_owner_and_admin_aal2: OK' AS resultado;
ROLLBACK;
