-- logical-vs-physical-drift.sql — Rodada 19/10
-- Proposito: checksum (contagem + md5 dos ids ordenados) das tabelas criticas, para diff
--            entre origem/destino ou entre replicas.
-- Classe   : SNAPSHOT (informativo; saida estavel para diff)
-- Variaveis: -v tabelas=contacts,companies,interactions,deals (lista de tabelas de public)
-- Saida    : 0. Uma linha por tabela: nome|linhas|md5  (ou nome|AUSENTE|- / nome|SEM_COLUNA_ID|-).
-- Custo    : le todos os ids de cada tabela (seq scan + sort).
\set ON_ERROR_STOP on
\pset pager off
\if :{?tabelas}
\else
  \set tabelas contacts,companies,interactions,deals
\endif
\echo '== logical-vs-physical-drift =='
\pset format unaligned
\pset tuples_only on
SELECT CASE
         WHEN to_regclass(format('public.%I', t.nome)) IS NULL
           THEN format('SELECT %L', t.nome || '|AUSENTE|-')
         WHEN NOT EXISTS (SELECT 1 FROM pg_attribute a
                           WHERE a.attrelid = to_regclass(format('public.%I', t.nome))
                             AND a.attname = 'id' AND NOT a.attisdropped)
           THEN format('SELECT %L', t.nome || '|SEM_COLUNA_ID|-')
         ELSE format('SELECT %L || COUNT(*) || ''|'' || COALESCE(MD5(string_agg(id::text, '','' ORDER BY id)),''empty'') FROM public.%I',
                     t.nome || '|', t.nome)
       END
  FROM (SELECT btrim(x) AS nome, ord
          FROM unnest(string_to_array(:'tabelas', ',')) WITH ORDINALITY AS u(x, ord)
         WHERE btrim(x) <> '') t
 ORDER BY t.ord
\gexec
\echo 'REC: rodar em ambos os replicas; diff nao-vazio = corrupcao silenciosa.'
