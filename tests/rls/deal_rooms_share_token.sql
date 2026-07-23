-- Testes RLS — deal rooms públicos via share_token (Rodada 41/10)
-- Verifica que anon:
--   1) só enxerga salas com share_enabled=true
--   2) NÃO consegue alterar colunas fora de buyer_view_count/last_buyer_view_at
--   3) NÃO consegue INSERT/DELETE em deal_rooms
--   4) pode registrar view via UPDATE dos contadores permitidos

\set ON_ERROR_STOP on

BEGIN;

-- Fixtures: cria 1 dono e 2 salas (1 compartilhada, 1 privada)
SET LOCAL ROLE postgres;

INSERT INTO public.deal_rooms (id, user_id, name, share_enabled, share_token, buyer_view_count)
VALUES
  ('11111111-1111-1111-1111-111111111111', :'user_a'::uuid, 'Sala Pública', true,  'tok-public-xyz', 0),
  ('22222222-2222-2222-2222-222222222222', :'user_a'::uuid, 'Sala Privada', false, NULL,             0)
ON CONFLICT (id) DO UPDATE
  SET share_enabled = EXCLUDED.share_enabled,
      share_token   = EXCLUDED.share_token,
      buyer_view_count = EXCLUDED.buyer_view_count;

SET LOCAL ROLE anon;

\echo 'TEST: anon lê apenas salas com share_enabled=true'
DO $$
DECLARE public_ok BOOLEAN; private_leak INT;
BEGIN
  SELECT EXISTS(SELECT 1 FROM public.deal_rooms WHERE id='11111111-1111-1111-1111-111111111111')
    INTO public_ok;
  SELECT COUNT(*) FROM public.deal_rooms WHERE id='22222222-2222-2222-2222-222222222222'
    INTO private_leak;
  IF NOT public_ok THEN RAISE EXCEPTION '❌ anon deveria ver sala pública'; END IF;
  IF private_leak > 0 THEN RAISE EXCEPTION '❌ anon vazou sala privada'; END IF;
  RAISE NOTICE '✅ anon vê apenas share_enabled=true';
END $$;

\echo 'TEST: anon pode UPDATE buyer_view_count na sala pública'
DO $$
BEGIN
  UPDATE public.deal_rooms
     SET buyer_view_count = buyer_view_count + 1,
         last_buyer_view_at = now()
   WHERE id = '11111111-1111-1111-1111-111111111111';
  RAISE NOTICE '✅ anon incrementou contador da sala pública';
END $$;

\echo 'TEST: anon NÃO pode UPDATE coluna sensível (name) mesmo na sala pública'
DO $$
BEGIN
  BEGIN
    UPDATE public.deal_rooms SET name='hackeado'
     WHERE id = '11111111-1111-1111-1111-111111111111';
    RAISE EXCEPTION '❌ anon conseguiu alterar name (column privilege leak)';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ anon bloqueado por column-level grant em name';
  END;
END $$;

\echo 'TEST: anon NÃO pode INSERT em deal_rooms'
DO $$
BEGIN
  BEGIN
    INSERT INTO public.deal_rooms (user_id, name, share_enabled)
    VALUES (:'user_a'::uuid, 'injetada', true);
    RAISE EXCEPTION '❌ anon conseguiu INSERT em deal_rooms';
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN
    RAISE NOTICE '✅ anon bloqueado em INSERT';
  END;
END $$;

\echo 'TEST: anon NÃO pode DELETE em deal_rooms'
DO $$
BEGIN
  BEGIN
    DELETE FROM public.deal_rooms WHERE id='11111111-1111-1111-1111-111111111111';
    RAISE EXCEPTION '❌ anon conseguiu DELETE em deal_rooms';
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE '✅ anon bloqueado em DELETE';
  END;
END $$;

RESET ROLE;
ROLLBACK;