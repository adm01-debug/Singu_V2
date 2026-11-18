-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260720134426
-- nome:   bd1_drop_old_create_deal_overload

-- Drop the old 7-parameter overload of create_deal that accepted a caller-supplied p_user_id.
-- The new 6-parameter version (without p_user_id) is the canonical one and always uses auth.uid().
DROP FUNCTION IF EXISTS public.create_deal(
  uuid, text, numeric, text, date, uuid, uuid
);
