-- ============================================================================
-- mark-must-reset.sql
-- ----------------------------------------------------------------------------
-- Marca todos os usuários migrados com { must_reset_password: true }.
-- Executar no BANCO DE DESTINO após import de auth.users e ANTES do disparo
-- dos emails de recovery.
--
-- Somente afeta usuários com provider 'email' (login por senha). Contas
-- exclusivamente sociais (Google/Apple) são ignoradas.
-- ============================================================================

BEGIN;

WITH email_users AS (
  SELECT u.id
  FROM auth.users u
  WHERE EXISTS (
    SELECT 1
    FROM auth.identities i
    WHERE i.user_id = u.id
      AND i.provider = 'email'
  )
)
UPDATE auth.users u
SET raw_user_meta_data =
      COALESCE(u.raw_user_meta_data, '{}'::jsonb)
   || jsonb_build_object(
        'must_reset_password', true,
        'migrated_at',         to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
FROM email_users e
WHERE u.id = e.id
  AND COALESCE((u.raw_user_meta_data->>'must_reset_password')::boolean, false) IS DISTINCT FROM true;

-- Sanity: quantos usuários agora exigem reset?
SELECT
  count(*) FILTER (WHERE (raw_user_meta_data->>'must_reset_password')::boolean IS TRUE) AS must_reset,
  count(*)                                                                              AS total_users
FROM auth.users;

COMMIT;