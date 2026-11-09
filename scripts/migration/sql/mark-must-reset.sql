-- ============================================================================
-- mark-must-reset.sql
-- ----------------------------------------------------------------------------
-- Marca todos os usuários migrados com { must_reset_password: true }.
-- Executar no BANCO DE DESTINO após import de auth.users e ANTES do disparo
-- dos emails de recovery.
--
-- Somente afeta usuários com provider 'email' (login por senha). Contas
-- exclusivamente sociais (Google/Apple) são ignoradas.
--
-- Idempotente: rodar de novo não altera quem já está marcado (migrated_at é
-- preservado). Compara o JSON sem cast: metadado com valor estranho
-- ("sim", 1, null) não aborta o script — é sobrescrito por true.
-- raw_user_meta_data que não seja objeto JSON (null/array/escalar) é tratado
-- como {} (o Auth só aceita objeto nesse campo).
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
      CASE WHEN jsonb_typeof(u.raw_user_meta_data) = 'object' THEN u.raw_user_meta_data ELSE '{}'::jsonb END
   || jsonb_build_object(
        'must_reset_password', true,
        'migrated_at',         to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
      )
FROM email_users e
WHERE u.id = e.id
  AND (jsonb_typeof(u.raw_user_meta_data) IS DISTINCT FROM 'object'
       OR u.raw_user_meta_data->'must_reset_password' IS DISTINCT FROM 'true'::jsonb);

-- Sanity: quantos usuários agora exigem reset?
SELECT
  count(*) FILTER (WHERE jsonb_typeof(raw_user_meta_data) = 'object'
                     AND raw_user_meta_data->'must_reset_password' = 'true'::jsonb)     AS must_reset,
  count(*)                                                                              AS total_users
FROM auth.users;

COMMIT;