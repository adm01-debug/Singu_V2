-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260308171347
-- nome:   coop003_batch0_execute

SELECT coop003_exec($c$92ab9890-683e-4e87-8fda-26b78a6fa2a0|00068987001581|CEP
02344eba-32c0-4f44-bf55-8d09e3b29fcd|00068987001158|CEP
756337c8-bc0b-4ef5-a81e-ce10e57b5e05|00259231000203|CEP
ab076814-8524-4eee-969b-f0c61da81781|00259231001781|CEP
44a83e27-0b24-48fc-9083-11a3b20352f0|00259231002672|CEP
87baf7e5-39f3-45b2-b1de-b4bec037bba2|00259231000890|CEP
7527c682-789a-4e79-a220-c03d45c35259|00259231000548|CEP
4212dd11-988d-4b39-a671-b9210e6d74cb|00259231002168|CEP
bbb66bef-73b6-4b8a-bdfd-09b53e9b7d99|00259231001510|CEP
bff894bc-aa75-4606-8494-a4813c55ff62|00259231001358|CEP$c$);
