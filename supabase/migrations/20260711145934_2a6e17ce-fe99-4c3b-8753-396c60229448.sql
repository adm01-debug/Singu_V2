-- MIGRATION B: Endurecer SECURITY DEFINER — REVOKE anon/PUBLIC + garantir search_path

-- 1) REVOKE EXECUTE de PUBLIC e anon em todas as funcoes SECURITY DEFINER do schema public.
--    GRANT EXECUTE a authenticated como default.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM PUBLIC', r.nspname, r.proname, r.args);
    EXECUTE format('REVOKE ALL ON FUNCTION %I.%I(%s) FROM anon', r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO authenticated', r.nspname, r.proname, r.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role', r.nspname, r.proname, r.args);
  END LOOP;
END $$;

-- 2) Re-liberar anon EXPLICITAMENTE para fluxos publicos legítimos.
GRANT EXECUTE ON FUNCTION public.get_deal_room_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_buyer_document_path(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.buyer_add_comment(text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.buyer_toggle_milestone(text, uuid, boolean, text) TO anon;
GRANT EXECUTE ON FUNCTION public.record_buyer_view(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_form(text, jsonb, jsonb, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.track_magnet_download(text, text, text, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_form_view(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_magnet_view(text) TO anon;

-- 3) Garantir SET search_path = public, pg_temp em toda funcao SECURITY DEFINER
--    (evita search_path injection). Se ja existir search_path, sobrepoe com valor endurecido.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid, n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
      r.nspname, r.proname, r.args);
  END LOOP;
END $$;
