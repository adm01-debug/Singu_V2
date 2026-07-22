-- logical-vs-physical-drift.sql — Rodada 19/10
-- Diff logico vs fisico via checksum de linhas por tabela critica.
\echo '== logical-vs-physical-drift =='
\pset format unaligned
\pset tuples_only on
SELECT 'contacts|' || COUNT(*) || '|' || COALESCE(MD5(string_agg(id::text, ',' ORDER BY id)),'empty')
  FROM public.contacts
UNION ALL
SELECT 'companies|' || COUNT(*) || '|' || COALESCE(MD5(string_agg(id::text, ',' ORDER BY id)),'empty')
  FROM public.companies
UNION ALL
SELECT 'interactions|' || COUNT(*) || '|' || COALESCE(MD5(string_agg(id::text, ',' ORDER BY id)),'empty')
  FROM public.interactions
UNION ALL
SELECT 'deals|' || COUNT(*) || '|' || COALESCE(MD5(string_agg(id::text, ',' ORDER BY id)),'empty')
  FROM public.deals;
\echo 'REC: rodar em ambos os replicas; diff nao-vazio = corrupcao silenciosa.'