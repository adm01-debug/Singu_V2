-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260319204133
-- nome:   pix_accounts_add_check_and_fix_gaps

-- GAP 1: Bloquear pix_chave vazia
ALTER TABLE public.pix_accounts 
ADD CONSTRAINT chk_pix_chave_not_empty CHECK (pix_chave <> '');

-- GAP 2: Bloquear pix_favorecido vazio (mesma lógica — se preencheu, não pode ser '')
ALTER TABLE public.pix_accounts 
ADD CONSTRAINT chk_pix_favorecido_not_empty CHECK (pix_favorecido IS NULL OR pix_favorecido <> '');
