-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321142547
-- nome:   add_lead_status_to_sales

ALTER TABLE public.sales DROP CONSTRAINT sales_status_check;
ALTER TABLE public.sales ADD CONSTRAINT sales_status_check CHECK (status = ANY (ARRAY['completed','pending','cancelled','negotiation','proposal','qualification','discovery','lead']));
