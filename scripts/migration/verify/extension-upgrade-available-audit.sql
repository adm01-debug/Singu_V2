-- extension-upgrade-available-audit.sql — Rodada 24/10 (gap 26)
-- Proposito: extensoes com nova versao disponivel porem nao aplicadas via ALTER EXTENSION UPDATE.
-- Classe   : AUDIT (informativo; nunca falha por achado)
-- Variaveis: nenhuma
-- Saida    : 0.
-- Nota     : compara com default_version (MAX(version) textual erra: '1.9' > '1.10').
\set ON_ERROR_STOP on
\pset pager off
\echo '== extension-upgrade-available-audit =='
SELECT e.extname, e.extversion AS installed,
       a.default_version AS available
  FROM pg_extension e
  JOIN pg_available_extensions a ON a.name = e.extname
 WHERE a.default_version IS DISTINCT FROM e.extversion
 ORDER BY e.extname;
\echo 'REC: rodar ALTER EXTENSION <name> UPDATE nas divergentes apos smoke test.'
