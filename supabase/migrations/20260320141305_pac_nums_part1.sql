-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260320141305
-- nome:   pac_nums_part1

UPDATE companies c SET numero_cooperativa = v.num_pac FROM (VALUES ('58fffccb-d858-4295-ba74-62576e6e6b82'::uuid,'16'),('e74d4278-f431-4624-9dcd-e7f6cbe0f792'::uuid,'20'),('05ebf790-1233-4b4c-9e2e-0123e1fa4220'::uuid,'19'),('9210c80a-c8db-4a93-b545-bd94880ea013'::uuid,'5'),('098df807-02a5-4e59-80d0-f158fd4a1b7f'::uuid,'8'),('f1b75f07-8ea9-4638-8b8e-f49638c274ba'::uuid,'2'),('75161e18-c79f-4626-a126-8a0c8526bdfc'::uuid,'7'),('5a6155fe-5901-44ca-8884-38d00759ae0d'::uuid,'9'),('399341bb-1a3d-48ff-8b1e-0e0d510d17a8'::uuid,'18'),('d4e1609c-d882-4bd0-82ce-f534c859ab3f'::uuid,'3'),('6687abc9-740f-4e1e-9035-cd9bd15e07fa'::uuid,'12'),('8fbea1d2-b2c9-4354-b8dd-f4fd703626c0'::uuid,'15'),('2c1e4af5-df2e-4bc5-81b1-cfa854c71354'::uuid,'21'),('26fff95a-bf7f-404c-8cee-b5e0197c5ecd'::uuid,'11'),('01ba5429-a413-41d0-bc42-24a6b3408e82'::uuid,'13'),('7034dc9c-0243-425c-bbd8-9699f2cee6a0'::uuid,'29'),('6c2cbb9e-7991-45ef-89fd-fb35fb4bc20c'::uuid,'33'),('a02454a7-fc6c-45dc-a341-0a52b0f30194'::uuid,'8'),('c0b29410-62b1-43ee-855b-6f33e2c03031'::uuid,'25'),('b77f024d-10c8-4d25-b017-9809669725fc'::uuid,'35')) AS v(pac_id, num_pac) WHERE c.id = v.pac_id;
