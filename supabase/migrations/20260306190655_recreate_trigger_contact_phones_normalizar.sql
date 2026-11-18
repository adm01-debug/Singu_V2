-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260306190655
-- nome:   recreate_trigger_contact_phones_normalizar

CREATE TRIGGER trg_contact_phones_normalizar
BEFORE INSERT OR UPDATE ON contact_phones
FOR EACH ROW EXECUTE FUNCTION trg_normalizar_telefone_contact();
